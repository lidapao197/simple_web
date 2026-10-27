/* =========================================================
   天气数据源配置（本地文件，直接用编辑器修改）
   ---------------------------------------------------------
   保存后刷新页面即生效。app.js 读取 window.WEATHER_DATA。

   为什么是 .js 而不是 .json：
     浏览器以 file:// 打开页面时会因跨域策略拒绝 fetch 本地 JSON，
     而 <script> 不受此限制，双击 index.html 也能读到本文件。

   apis   —— 天气接口清单
     id     唯一标识（改动会使已保存的选择失效，建议保持不变）
     name   设置面板中显示的名称
     url    接口地址，需支持 GET {url}?city=城市名

   cities —— 城市清单
     id        唯一标识
     province  省份 / 直辖市名称（与 city 相同则只显示一次）
     city      城市名称，末尾的「市」会自动去掉再传给接口
     district  可选，区 / 县名称。填了会按「城市+区」查询（如 广州市天河区），
               精度到区，且能避开「天河」「朝阳」这类同名歧义
     query     可选，显式指定传给接口的名称，优先级最高
   ========================================================= */

window.WEATHER_DATA = {
  apis: [
    { id: 'hgovo', name: '默认接口', url: 'https://api.hgovo.cn/API/zgtq' },
    /* 备用接口示例：取消注释并填入真实地址即可
    { id: 'backup', name: '备用接口', url: 'https://example.com/api/weather' },
    */
  ],

  cities: [
    { id: 'beijing', province: '北京市', city: '北京市' },
    { id: 'shanghai', province: '上海市', city: '上海市' },
    { id: 'tianjin', province: '天津市', city: '天津市' },
    { id: 'chongqing', province: '重庆市', city: '重庆市' },
    { id: 'guangzhou', province: '广东省', city: '广州市' },
    { id: 'guangzhou-tianhe', province: '广东省', city: '广州市', district: '天河区' },
    { id: 'shenzhen', province: '广东省', city: '深圳市' },
    { id: 'shenzhen-nanshan', province: '广东省', city: '深圳市', district: '南山区' },
    { id: 'hangzhou', province: '浙江省', city: '杭州市' },
    { id: 'ningbo', province: '浙江省', city: '宁波市' },
    { id: 'nanjing', province: '江苏省', city: '南京市' },
    { id: 'suzhou', province: '江苏省', city: '苏州市' },
    { id: 'chengdu', province: '四川省', city: '成都市' },
    { id: 'wuhan', province: '湖北省', city: '武汉市' },
    { id: 'xian', province: '陕西省', city: '西安市' },
    { id: 'changsha', province: '湖南省', city: '长沙市' },
    { id: 'zhengzhou', province: '河南省', city: '郑州市' },
    { id: 'jinan', province: '山东省', city: '济南市' },
    { id: 'qingdao', province: '山东省', city: '青岛市' },
    { id: 'xiamen', province: '福建省', city: '厦门市' },
    { id: 'fuzhou', province: '福建省', city: '福州市' },
    { id: 'hefei', province: '安徽省', city: '合肥市' },
    { id: 'nanchang', province: '江西省', city: '南昌市' },
    { id: 'shenyang', province: '辽宁省', city: '沈阳市' },
    { id: 'dalian', province: '辽宁省', city: '大连市' },
    { id: 'harbin', province: '黑龙江省', city: '哈尔滨市' },
    { id: 'changchun', province: '吉林省', city: '长春市' },
    { id: 'shijiazhuang', province: '河北省', city: '石家庄市' },
    { id: 'taiyuan', province: '山西省', city: '太原市' },
    { id: 'kunming', province: '云南省', city: '昆明市' },
    { id: 'guiyang', province: '贵州省', city: '贵阳市' },
    { id: 'nanning', province: '广西壮族自治区', city: '南宁市' },
    { id: 'haikou', province: '海南省', city: '海口市' },
    { id: 'lanzhou', province: '甘肃省', city: '兰州市' },
    { id: 'urumqi', province: '新疆维吾尔自治区', city: '乌鲁木齐市' },
    { id: 'hohhot', province: '内蒙古自治区', city: '呼和浩特市' },
    { id: 'yinchuan', province: '宁夏回族自治区', city: '银川市' },
    { id: 'xining', province: '青海省', city: '西宁市' },
    { id: 'lhasa', province: '西藏自治区', city: '拉萨市' },
    { id: 'hongkong', province: '香港特别行政区', city: '香港特别行政区' },
    { id: 'macao', province: '澳门特别行政区', city: '澳门特别行政区' },
    { id: 'taipei', province: '台湾省', city: '台北市' },
  ],
};
