// SankeyBuilder - 支持基础桑基图和层级桑基图的数据转换

// ==================== 通用 Pipeline 函数 ====================

// Advanced Pipeline - 数据预处理
const initAdvancedVSeed = (advancedVSeed, context) => {
    const { vseed } = context;
    const { chartType, dataset } = vseed;

    if (!chartType) throw new Error('chartType is required');
    if (!dataset || dataset.length === 0) throw new Error('dataset is required and must not be empty');

    return {
        ...advancedVSeed,
        chartType,
        dataset
    };
};

// 基础桑基图字段识别
const identifyFieldsForSankey = (advancedVSeed, context) => {
    const { vseed } = context;
    const { dataset } = advancedVSeed;
    const sample = dataset[0];
    const allFields = Object.keys(sample);

    // 识别所有数值字段
    const numericFields = allFields.filter(field =>
        typeof sample[field] === 'number'
    );

    if (numericFields.length === 0) {
        throw new Error('Dataset must have at least one numeric field');
    }

    // 确定 value 字段（用于表示流量值）
    let valueField;
    if (vseed.value) {
        // 用户指定了 value
        valueField = vseed.value;
        if (!numericFields.includes(valueField)) {
            throw new Error(`Specified value field "${valueField}" is not a numeric field`);
        }
    } else {
        // 默认使用第一个数值字段作为value
        valueField = numericFields[0];
    }

    // 确定 source 和 target 字段
    let sourceField, targetField;
    if (vseed.source && vseed.target) {
        // 用户指定了 source 和 target
        sourceField = vseed.source;
        targetField = vseed.target;
        
        if (!allFields.includes(sourceField)) {
            throw new Error(`Specified source field "${sourceField}" does not exist in dataset`);
        }
        if (!allFields.includes(targetField)) {
            throw new Error(`Specified target field "${targetField}" does not exist in dataset`);
        }
    } else {
        // 默认使用第一和第二个非数值字段
        const nonNumericFields = allFields.filter(field => 
            field !== valueField && typeof sample[field] !== 'number'
        );
        
        if (nonNumericFields.length < 2) {
            throw new Error('Dataset must have at least two non-numeric fields for source and target');
        }
        
        sourceField = nonNumericFields[0];
        targetField = nonNumericFields[1];
    }

    console.log('基础桑基图字段识别结果:', {
        allFields,
        numericFields,
        valueField,
        sourceField,
        targetField
    });

    return {
        ...advancedVSeed,
        valueField,
        sourceField,
        targetField,
        numericFields
    };
};

// 层级桑基图字段识别（处理树形结构）
const identifyFieldsForHierarchicalSankey = (advancedVSeed, context) => {
    const { vseed } = context;
    const { dataset } = advancedVSeed;

    // 检查数据是否是树形结构
    const isTreeStructure = Array.isArray(dataset) && 
        (typeof dataset[0] === 'object') && 
        ('name' in dataset[0]) && 
        ('value' in dataset[0]);

    if (!isTreeStructure) {
        throw new Error('层级桑基图需要树形结构数据，每个节点必须有name和value属性');
    }

    console.log('层级桑基图字段识别结果: 树形结构数据，使用name和value字段');

    return {
        ...advancedVSeed,
        isHierarchical: true,
        valueField: 'value',
        nameField: 'name'
    };
};

// 构建度量字段
const buildMeasures = (advancedVSeed, context) => {
    const { valueField } = advancedVSeed;

    // 只有一个 measure
    const measures = [{
        id: valueField,
        alias: valueField
    }];

    return {
        ...advancedVSeed,
        measures
    };
};

// 基础桑基图的维度构建
const buildDimensionsForSankey = (advancedVSeed, context) => {
    const { sourceField, targetField } = advancedVSeed;

    // 基础桑基图有source和target两个维度
    const dimensions = [
        { id: sourceField, alias: sourceField },
        { id: targetField, alias: targetField }
    ];

    console.log('基础桑基图维度配置:', dimensions);

    return {
        ...advancedVSeed,
        dimensions
    };
};

// 层级桑基图的维度构建（使用name作为维度）
const buildDimensionsForHierarchicalSankey = (advancedVSeed, context) => {
    // 层级桑基图使用name作为维度
    const dimensions = [
        { id: 'name', alias: 'name' }
    ];

    console.log('层级桑基图维度配置:', dimensions);

    return {
        ...advancedVSeed,
        dimensions
    };
};

// 颜色配置
const buildColorConfig = (advancedVSeed, context) => {
    const { vseed } = context;

    // 用户自定义颜色 > 默认颜色
    const colorScheme = vseed.colorScheme || {
        type: 'ordinal',
        range: [
            '#8D72F6', '#5766EC', '#66A3FE', '#51D5E6',
            '#4EC0B3', '#F9DF90', '#F9AD71', '#ED8888',
            '#E9A0C3', '#D77DD3'
        ]
    };

    return {
        ...advancedVSeed,
        colorScheme
    };
};

// 标签配置
const buildLabelConfig = (advancedVSeed, context) => {
    const { vseed } = context;

    // 用户自定义标签 > 默认标签
    const labelConfig = vseed.label || {
        visible: true,
        style: {
            fontSize: 10
        }
    };

    return {
        ...advancedVSeed,
        labelConfig
    };
};

// ==================== Spec Pipeline 函数 ====================

// 构建基础桑基图数据
const buildSankeyData = (spec, context) => {
    const { advancedVSeed } = context;
    const { dataset, sourceField, targetField, valueField } = advancedVSeed;

    // 1. 收集所有唯一的节点名称
    const nodeNames = new Set();
    const links = dataset.map(row => {
        const source = String(row[sourceField]);
        const target = String(row[targetField]);
        const value = row[valueField];
        
        nodeNames.add(source);
        nodeNames.add(target);
        
        return { source, target, value };
    });

    // 2. 构建节点数组（按照官方示例格式：{ nodeName: "节点名称" }）
    const nodes = Array.from(nodeNames).map(nodeName => ({
        nodeName
    }));

    // 3. 将links中的source/target字符串转换为节点索引
    const nodeMap = {};
    nodes.forEach((node, index) => {
        nodeMap[node.nodeName] = index;
    });

    const formattedLinks = links.map(link => ({
        source: nodeMap[link.source],
        target: nodeMap[link.target],
        value: link.value
    }));

    console.log('构建的基础桑基图数据:');
    console.log('- 节点数量:', nodes.length);
    console.log('- 连接数量:', formattedLinks.length);

    // 按照官方示例格式构建数据
    return {
        ...spec,
        data: [{
            values: [{
                nodes: nodes,
                links: formattedLinks
            }]
        }]
    };
};

// 构建层级桑基图数据
const buildHierarchicalSankeyData = (spec, context) => {
    const { advancedVSeed } = context;
    const { dataset } = advancedVSeed;

    console.log('构建层级桑基图数据:', dataset);

    // 直接使用树形结构数据
    return {
        ...spec,
        data: [{
            values: [{
                nodes: dataset
            }]
        }]
    };
};

// 应用颜色方案
const applyColorScheme = (spec, context) => {
    const { advancedVSeed } = context;
    const { colorScheme } = advancedVSeed;

    return {
        ...spec,
        color: colorScheme
    };
};

// 应用标签
const applyLabels = (spec, context) => {
    const { advancedVSeed } = context;
    const { labelConfig } = advancedVSeed;

    // 按照官方示例格式设置标签
    const sankeyLabel = {
        visible: labelConfig.visible,
        style: {
            fontSize: 10,
            ...labelConfig.style
        }
    };

    return {
        ...spec,
        label: sankeyLabel
    };
};

// 应用提示框
/////////////////////////////////////////////////////
// SankeyBuilder - 支持基础桑基图和层级桑基图的数据转换

// ==================== 通用 Pipeline 函数 ====================

// ... [前面的代码保持不变，直到applyTooltip函数] ...

// 应用提示框 - 修改版，添加详细信息
const applyTooltip = (spec, context) => {
    const { vseed, advancedVSeed } = context;

    // 用户自定义 > 默认配置
    const tooltipConfig = vseed.tooltip !== undefined ? vseed.tooltip : {
        visible: true,
        mark: {
            title: {
                value: datum => {
                    // 对于连接线，显示起点和终点
                    if (datum.datum && datum.datum.source !== undefined) {
                        const nodes = spec.data[0].values[0].nodes;
                        const links = spec.data[0].values[0].links;
                        const linkIndex = datum.datumIndex;
                        
                        if (linkIndex >= 0 && linkIndex < links.length) {
                            const link = links[linkIndex];
                            let sourceName, targetName;
                            
                            if (spec.categoryField === 'nodeName') {
                                // 基础桑基图格式
                                sourceName = nodes[link.source].nodeName;
                                targetName = nodes[link.target].nodeName;
                            } else if (spec.categoryField === 'name') {
                                // 层级桑基图格式
                                // 需要递归查找节点名称
                                const findNodeName = (nodes, index, currentPath = []) => {
                                    for (const node of nodes) {
                                        if (node.name === index.toString() || 
                                            nodes.indexOf(node) === index) {
                                            return currentPath.concat(node.name).join(' > ');
                                        }
                                        if (node.children) {
                                            const result = findNodeName(node.children, index, currentPath.concat(node.name));
                                            if (result) return result;
                                        }
                                    }
                                    return index.toString();
                                };
                                
                                sourceName = findNodeName(nodes, link.source, []);
                                targetName = findNodeName(nodes, link.target, []);
                            } else {
                                sourceName = `节点 ${link.source}`;
                                targetName = `节点 ${link.target}`;
                            }
                            
                            return `${sourceName} → ${targetName}`;
                        }
                    }
                    return '';
                }
            },
            content: [
                {
                    key: '起点',
                    value: datum => {
                        if (datum.datum && datum.datum.source !== undefined) {
                            const nodes = spec.data[0].values[0].nodes;
                            const links = spec.data[0].values[0].links;
                            const linkIndex = datum.datumIndex;
                            
                            if (linkIndex >= 0 && linkIndex < links.length) {
                                const link = links[linkIndex];
                                if (spec.categoryField === 'nodeName') {
                                    return nodes[link.source].nodeName;
                                } else {
                                    // 对于层级桑基图，显示完整的节点路径
                                    const findNodePath = (nodes, index, currentPath = []) => {
                                        for (const node of nodes) {
                                            if (node.name === index.toString() || 
                                                nodes.indexOf(node) === index) {
                                                return currentPath.concat(node.name).join(' > ');
                                            }
                                            if (node.children) {
                                                const result = findNodePath(node.children, index, currentPath.concat(node.name));
                                                if (result) return result;
                                            }
                                        }
                                        return `节点 ${index}`;
                                    };
                                    return findNodePath(nodes, link.source, []);
                                }
                            }
                        }
                        return '';
                    }
                },
                {
                    key: '终点',
                    value: datum => {
                        if (datum.datum && datum.datum.target !== undefined) {
                            const nodes = spec.data[0].values[0].nodes;
                            const links = spec.data[0].values[0].links;
                            const linkIndex = datum.datumIndex;
                            
                            if (linkIndex >= 0 && linkIndex < links.length) {
                                const link = links[linkIndex];
                                if (spec.categoryField === 'nodeName') {
                                    return nodes[link.target].nodeName;
                                } else {
                                    // 对于层级桑基图，显示完整的节点路径
                                    const findNodePath = (nodes, index, currentPath = []) => {
                                        for (const node of nodes) {
                                            if (node.name === index.toString() || 
                                                nodes.indexOf(node) === index) {
                                                return currentPath.concat(node.name).join(' > ');
                                            }
                                            if (node.children) {
                                                const result = findNodePath(node.children, index, currentPath.concat(node.name));
                                                if (result) return result;
                                            }
                                        }
                                        return `节点 ${index}`;
                                    };
                                    return findNodePath(nodes, link.target, []);
                                }
                            }
                        }
                        return '';
                    }
                },
                {
                    key: '流量值',
                    value: datum => {
                        if (datum.datum && datum.datum.value !== undefined) {
                            const links = spec.data[0].values[0].links;
                            const linkIndex = datum.datumIndex;
                            if (linkIndex >= 0 && linkIndex < links.length) {
                                const value = links[linkIndex].value;
                                // 格式化数字显示
                                if (Number.isInteger(value)) {
                                    return value.toLocaleString();
                                } else {
                                    return value.toFixed(2);
                                }
                            }
                        }
                        return '';
                    }
                }
            ]
        }
    };

    return {
        ...spec,
        tooltip: tooltipConfig
    };
};

////////////////////////////////////////////////////////////

// 构建基础桑基图spec - 添加连接线悬停效果
const buildSankeySpec = (spec, context) => {
    const { vseed } = context;

    // 按照官方示例格式构建完整的桑基图spec
    const baseSpec = {
        ...spec,
        type: 'sankey',
        categoryField: 'nodeName',  // 节点名称字段（官方示例用nodeName）
        valueField: 'value',        // 流量值字段
        sourceField: 'source',      // 源节点字段（索引）
        targetField: 'target',      // 目标节点字段（索引）

        // 布局配置（和官方示例一致）
        nodeAlign: 'justify',
        nodeGap: 8,
        nodeWidth: 10,
        minNodeHeight: 4,

        // 节点配置（和官方示例一致）
        node: {
            style: {
                fill: (datum) => {
                    // 根据节点名称映射颜色
                    const colorScheme = spec.color.range;
                    const nodes = spec.data[0].values[0].nodes;
                    const index = nodes.findIndex(n => n.nodeName === datum.name) % colorScheme.length;
                    return colorScheme[index];
                },
                fillOpacity: 0.8,
                stroke: '#fff',
                lineWidth: 1
            },
            state: {
                hover: {
                    stroke: '#333333',
                    lineWidth: 2,
                    fillOpacity: 1
                },
                selected: {
                    fill: '#dddddd',
                    stroke: '#333333',
                    lineWidth: 1,
                    brighter: 1,
                    fillOpacity: 1
                }
            }
        },

        // 连接线配置 - 增强悬停效果
        link: {
            style: {
                fill: (datum) => {
                    // 使用源节点的颜色
                    const colorScheme = spec.color.range;
                    const nodes = spec.data[0].values[0].nodes;
                    const sourceNode = nodes[datum.source];
                    if (sourceNode) {
                        const index = nodes.findIndex(n => n.nodeName === sourceNode.nodeName) % colorScheme.length;
                        return colorScheme[index];
                    }
                    return '#cccccc';
                },
                fillOpacity: 0.4,
                stroke: 'transparent'
            },
            state: {
                hover: {
                    fillOpacity: 0.9,
                    stroke: '#333',
                    lineWidth: 1
                },
                selected: {
                    fill: '#dddddd',
                    stroke: '#333333',
                    lineWidth: 1,
                    brighter: 1,
                    fillOpacity: 1
                }
            }
        }
    };

    // 添加标题（如果用户提供了）
    if (vseed.title) {
        baseSpec.title = vseed.title;
    }

    console.log('生成的基础桑基图spec:', baseSpec);
    return baseSpec;
};

// 构建层级桑基图spec - 添加连接线悬停效果
const buildHierarchicalSankeySpec = (spec, context) => {
    const { vseed } = context;

    // 按照层级桑基图官方示例格式构建
    const baseSpec = {
        ...spec,
        type: 'sankey',
        categoryField: 'name',  // 节点名称字段
        valueField: 'value',    // 节点值字段

        // 布局配置
        nodeAlign: 'left',
        nodeGap: 8,
        nodeWidth: 10,
        minNodeHeight: 4,
        nodeKey: datum => datum.name,  // 节点唯一标识

        // 标签配置
        label: {
            visible: true,
            state: {
                blur: {
                    fill: '#e8e8e8',
                    fillOpacity: 0.15
                }
            }
        },

        // 节点配置
        node: {
            state: {
                hover: {
                    fill: 'red'
                },
                blur: {
                    fill: '#e8e8e8',
                    fillOpacity: 0.15
                }
            }
        },

        // 连接线配置 - 增强悬停效果
        link: {
            backgroundStyle: { fill: '#ccc', fillOpacity: 0.2 },
            fillOpacity: 0.6,
            style: {
                stroke: 'transparent'
            },
            state: {
                hover: {
                    fillOpacity: 1,
                    stroke: '#000000',
                    lineWidth: 1
                },
                blur: {
                    fill: '#e8e8e8'
                }
            }
        },

        // 强调效果
        emphasis: {
            enable: true,
            effect: 'related'
        }
    };

    // 添加标题（如果用户提供了）
    if (vseed.title) {
        baseSpec.title = vseed.title;
    }

    console.log('生成的层级桑基图spec:', baseSpec);
    return baseSpec;
};

// ... [后面的代码保持不变] ...

//////////////////////////////////////////////////////////////////

// ==================== Pipeline 定义 ====================

// 基础桑基图Pipeline
const sankeyAdvancedPipeline = [
    initAdvancedVSeed,
    identifyFieldsForSankey,
    buildMeasures,
    buildDimensionsForSankey,
    buildColorConfig,
    buildLabelConfig
];

const sankeySpecPipeline = [
    buildSankeyData,
    applyColorScheme,
    applyLabels,
    applyTooltip,
    buildSankeySpec
];

// 层级桑基图Pipeline
const hierarchicalSankeyAdvancedPipeline = [
    initAdvancedVSeed,
    identifyFieldsForHierarchicalSankey,
    buildMeasures,
    buildDimensionsForHierarchicalSankey,
    buildColorConfig,
    buildLabelConfig
];

const hierarchicalSankeySpecPipeline = [
    buildHierarchicalSankeyData,
    applyColorScheme,
    applyLabels,
    applyTooltip,
    buildHierarchicalSankeySpec
];

// ==================== Builder 类 ====================

class SankeyBuilder {
    constructor(vseed) {
        this._vseed = vseed;
        this._advancedVSeed = null;
        this._spec = null;
    }

    get vseed() {
        return this._vseed;
    }

    get advancedVSeed() {
        return this._advancedVSeed;
    }

    get spec() {
        return this._spec;
    }

    // 执行 pipeline
    static execPipeline(pipeline, context, initialValue = {}) {
        return pipeline.reduce((prev, fn) => fn(prev, context), initialValue);
    }

    // 构建 advanced vseed
    buildAdvanced() {
        const { chartType } = this._vseed;
        const pipeline = SankeyBuilder._advancedPipelineMap[chartType];

        if (!pipeline) {
            throw new Error(`No advanced pipeline registered for chartType: ${chartType}`);
        }

        const context = { vseed: this._vseed };
        this._advancedVSeed = SankeyBuilder.execPipeline(pipeline, context);
        return this._advancedVSeed;
    }

    // 构建 spec
    buildSpec(advancedVSeed) {
        const { chartType } = this._vseed;
        const pipeline = SankeyBuilder._specPipelineMap[chartType];

        if (!pipeline) {
            throw new Error(`No spec pipeline registered for chartType: ${chartType}`);
        }

        const context = {
            vseed: this._vseed,
            advancedVSeed
        };

        this._spec = SankeyBuilder.execPipeline(pipeline, context);
        return this._spec;
    }

    // 完整构建流程
    build() {
        const advancedVSeed = this.buildAdvanced();
        const spec = this.buildSpec(advancedVSeed);
        return spec;
    }

    // 静态方法：创建 builder
    static from(vseed) {
        return new SankeyBuilder(vseed);
    }

    // 注册图表类型
    static register(chartType, advancedPipeline, specPipeline) {
        SankeyBuilder._advancedPipelineMap[chartType] = advancedPipeline;
        SankeyBuilder._specPipelineMap[chartType] = specPipeline;
    }

    // 注册所有支持的图表类型
    static registerAll() {
        // 基础桑基图
        SankeyBuilder.register('sankey', sankeyAdvancedPipeline, sankeySpecPipeline);
        // 层级桑基图
        SankeyBuilder.register('sankeyHierarchical', hierarchicalSankeyAdvancedPipeline, hierarchicalSankeySpecPipeline);
    }

    // Pipeline 存储
    static _advancedPipelineMap = {};
    static _specPipelineMap = {};
}

// 自动注册所有图表类型
SankeyBuilder.registerAll();

// 导出（浏览器环境）
if (typeof window !== 'undefined') {
    window.SankeyBuilder = SankeyBuilder;
}