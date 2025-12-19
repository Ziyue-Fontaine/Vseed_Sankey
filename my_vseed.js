// 基础桑基图测试数据
const sankeyData = {
    "dataset": [
        { "source": "农业", "target": "加工", "value": 100 },
        { "source": "加工", "target": "零售", "value": 80 },
        { "source": "加工", "target": "出口", "value": 20 },
        { "source": "采矿", "target": "加工", "value": 50 },
        { "source": "采矿", "target": "制造", "value": 30 },
        { "source": "制造", "target": "零售", "value": 40 },
        { "source": "制造", "target": "出口", "value": 10 },
        { "source": "能源", "target": "制造", "value": 60 },
        { "source": "能源", "target": "零售", "value": 20 },
        { "source": "零售", "target": "消费者", "value": 140 },
        { "source": "出口", "target": "国际市场", "value": 30 }
    ],
    "source": "source",
    "target": "target",
    "value": "value",
    
    "title": {
        "text": "商品供应链流程图",
        "subtext": "数据来源：示例数据 - 鼠标悬停在连接线上查看详细信息",
        "subtextStyle": {
            "fontSize": 12,
            "fill": "#666"
        }
    },
    
    "colorScheme": {
        "type": "ordinal",
        "range": [
            "#8D72F6", "#5766EC", "#66A3FE", "#51D5E6",
            "#4EC0B3", "#F9DF90", "#F9AD71", "#ED8888",
            "#E9A0C3", "#D77DD3", "#8A4EBF", "#3C53B7"
        ]
    },
    
    "tooltip": {
        "visible": true,
        "style": {
            "panel": {
                "padding": 12,
                "border": {
                    "radius": 8,
                    "width": 1,
                    "color": "#e3e5e8"
                },
                "backgroundColor": "#ffffff",
                "shadow": {
                    "x": 0,
                    "y": 4,
                    "blur": 12,
                    "spread": 0,
                    "color": "rgba(0, 0, 0, 0.1)"
                }
            },
            "title": {
                "fontSize": 14,
                "fontWeight": "bold",
                "fill": "#333"
            },
            "content": {
                "fontSize": 12,
                "fill": "#666"
            }
        }
    }
};

// 层级桑基图测试数据（完全按照官方示例的树形结构）
const hierarchicalSankeyData = {
    "dataset": [
        {
            "value": 100,
            "name": "A",
            "children": [
                {
                    "name": "top",
                    "value": 40,
                    "children": [
                        { "name": "00", "value": 15 },
                        { "name": "01", "value": 10 },
                        { "name": "02", "value": 10 }
                    ]
                },
                {
                    "name": "middle",
                    "value": 30,
                    "children": [
                        { "name": "00", "value": 10 },
                        { "name": "01", "value": 10 },
                        { "name": "02", "value": 10 }
                    ]
                },
                {
                    "name": "bottom",
                    "value": 30
                }
            ]
        },
        {
            "value": 80,
            "name": "B",
            "children": [
                {
                    "name": "top",
                    "value": 40,
                    "children": [
                        { "name": "00", "value": 100 },
                        { "name": "01", "value": 40 }
                    ]
                },
                {
                    "name": "middle",
                    "value": 10
                },
                {
                    "name": "bottom",
                    "value": 30
                }
            ]
        },
        {
            "value": 50,
            "name": "C",
            "children": [
                {
                    "name": "top",
                    "value": 20
                },
                {
                    "name": "middle",
                    "value": 20
                },
                {
                    "name": "bottom",
                    "value": 10
                }
            ]
        }
    ],
    
    "title": {
        "text": "层级桑基图示例",
        "subtext": "数据来源：VChart官方示例 - 展示树形层级结构",
        "subtextStyle": {
            "fontSize": 12,
            "fill": "#666"
        }
    },
    
    "colorScheme": {
        "type": "ordinal",
        "range": [
            "#8D72F6", "#5766EC", "#66A3FE", "#51D5E6",
            "#4EC0B3", "#F9DF90", "#F9AD71", "#ED8888",
            "#E9A0C3", "#D77DD3", "#8A4EBF", "#3C53B7"
        ]
    },
    
    "tooltip": {
        "visible": true,
        "style": {
            "panel": {
                "padding": 12,
                "border": {
                    "radius": 8,
                    "width": 1,
                    "color": "#e3e5e8"
                },
                "backgroundColor": "#ffffff",
                "shadow": {
                    "x": 0,
                    "y": 4,
                    "blur": 12,
                    "spread": 0,
                    "color": "rgba(0, 0, 0, 0.1)"
                }
            },
            "title": {
                "fontSize": 14,
                "fontWeight": "bold",
                "fill": "#333"
            },
            "content": {
                "fontSize": 12,
                "fill": "#666"
            }
        }
    },
    
    // 层级桑基图的额外配置
    "nodeAlign": "left",
    "nodeGap": 8,
    "nodeWidth": 10,
    "minNodeHeight": 4,
    "label": {
        "visible": true,
        "state": {
            "blur": {
                "fill": "#e8e8e8",
                "fillOpacity": 0.15
            }
        }
    },
    "node": {
        "state": {
            "hover": {
                "fill": "red"
            },
            "blur": {
                "fill": "#e8e8e8",
                "fillOpacity": 0.15
            }
        }
    },
    "link": {
        "backgroundStyle": { 
            "fill": "#ccc", 
            "fillOpacity": 0.2 
        },
        "fillOpacity": 0.8,
        "state": {
            "hover": {
                "stroke": "#000000"
            },
            "blur": {
                "fill": "#e8e8e8"
            }
        }
    },
    "emphasis": {
        "enable": true,
        "effect": "related"
    }
};

// 全局变量存储当前图表实例
let currentChart = null;
let currentDataType = 'sankey'; // 当前使用的数据类型

// 渲染基础桑基图
function renderSankeyChart() {
    currentDataType = 'sankey';
    renderChart('sankey', sankeyData);
}

// 渲染层级桑基图
function renderHierarchicalSankeyChart() {
    currentDataType = 'hierarchical';
    // 对于层级桑基图，我们需要传递树形结构数据
    renderChart('sankeyHierarchical', hierarchicalSankeyData);
}

// 通用渲染函数
function renderChart(chartType, data) {
    // 销毁之前的图表
    if (currentChart) {
        currentChart.release();
    }

    // 清空容器
    document.getElementById('chart').innerHTML = '';

    try {
        // 构建 vseed，继承所有可选配置
        const chartVSeed = {
            ...data,              // 继承所有字段
            chartType: chartType  // 设置图表类型
        };

        console.log(`渲染${chartType}，输入数据:`, chartVSeed);

        // 生成 spec 并渲染
        const spec = SankeyBuilder.from(chartVSeed).build();
        console.log(`生成的${chartType} spec:`, spec);

        // 检查spec格式
        console.log('检查spec格式:');
        console.log('- spec类型:', spec.type);
        console.log('- 数据格式:', spec.data[0].values[0] ? '正确' : '错误');
        console.log('- 节点数量:', spec.data[0].values[0]?.nodes?.length || spec.data[0].values[0]?.length || 0);

        currentChart = new VChart.VChart(spec, { 
            dom: 'chart',
            autoFit: true,
            animation: false
        });
        
        // 使用异步渲染
        currentChart.renderAsync().then(() => {
            console.log(`${chartType}渲染完成`);
            
            // 为了方便调试，将图表实例挂到window
            window.vchart = currentChart;
            console.log('图表实例已挂载到 window.vchart');
        }).catch(error => {
            console.error(`${chartType}渲染失败:`, error);
            console.error('错误详情:', error.message, error.stack);
        });
        
    } catch (error) {
        console.error('构建或渲染过程中出错:', error);
        console.error('错误栈:', error.stack);
    }
}

// 添加按钮事件监听
document.getElementById('btn-sankey').addEventListener('click', renderSankeyChart);
document.getElementById('btn-hierarchical-sankey').addEventListener('click', renderHierarchicalSankeyChart);

// 页面加载完成后默认显示基础桑基图
window.addEventListener('DOMContentLoaded', renderSankeyChart);

// 导出数据供外部使用（如果需要）
window.vseedData = {
    sankeyData,
    hierarchicalSankeyData
};