/* =========================================================
   LoL 赛事数据源配置（本地文件，直接用编辑器修改）
   ---------------------------------------------------------
   数据来自 Riot 官方赛事接口 esports-api.lolesports.com，
   该接口带 Access-Control-Allow-Origin: *，静态页可直接请求，
   不需要任何本地代理服务。

   apiKey  : 请求头 x-api-key。用的是 lolesports.com 网页端内置的
             公开 Key，不是官方发放的开发者凭证，若日后被轮换导致
             403，替换成新 Key 即可。
   base    : 接口前缀，一般不用改。
   hl      : 语言，zh-CN 时赛段名（如「瑞士轮」「第 1 周」）为中文。
   exclude : 需要排除的赛事 slug。该接口会返回非英雄联盟项目，
             默认排除云顶之弈（TFT Esports）。
   logoProxy: 队徽图片代理前缀，留空表示直连 static.lolesports.com。
             需要加速时填自己的代理（需原样拼接官方图片地址），例如
             'https://your-worker.example.workers.dev/?url='。
             注意：images.weserv.nl / wsrv.nl / jsdelivr 在国内多数网络下
             不可达，填了反而更慢，故默认留空。
   ========================================================= */

window.LOL_CONFIG = {
  apiKey: '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z',
  base: 'https://esports-api.lolesports.com/persisted/gw',
  hl: 'zh-CN',
  exclude: ['tft_esports'],
  logoProxy: '',
};
