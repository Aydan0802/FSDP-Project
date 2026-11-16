"use strict";

// Chinese (zh) red flags. Owner: Aydan. NEEDS A TEAMMATE WHO READS CHINESE TO CHECK IT.
// Each entry adds a Chinese reason and Chinese patterns to the rule with the same id in rules.js
// (points, votes and "ask" come from there). rules.js merges this file in.
// Chinese has no spaces between words, so these patterns don't use \b (word edges).
// [^。！？，；\n]{0,6} means "up to 6 more characters in the same sentence".

const RULES_ZH = {
  claims_bank: { reason: "自称是银行", patterns: [
    /【[^】]{0,10}银行[^】]{0,6}】/,
    /(?:银行|星展|华侨银行|大华银行|汇丰|花旗|渣打|马来亚银行)(?:安全|客服|风控)?(?:中心|部门|团队|通知)/
  ] },
  claims_government: { reason: "自称是警察或政府部门", patterns: [
    /(?:警察局|警方|公安局|警察|政府|移民局|海关|法院|税务局|人力部|卫生部|金管局|公积金局)/
  ] },
  claims_courier: { reason: "自称是快递公司", patterns: [/(?:新加坡邮政|快递公司|物流公司|邮政局)/] },
  no_name: { reason: "没有称呼您的名字", patterns: [/(?:尊敬的|亲爱的)(?:客户|用户|会员|持卡人)/] },
  account_problem: { reason: "说您的账户出了问题", patterns: [
    /(?:异常|可疑)(?:登录|登入|交易|活动)/,
    /(?:账户|帐户|账号|银行卡|信用卡)[^。！？，；\n]{0,6}(?:异常|被盗|有风险|涉嫌)/
  ] },
  threat: { reason: "用吓人的话逼您马上行动", patterns: [
    /(?:账户|帐户|账号|银行卡|信用卡|卡)[^。！？，；\n]{0,6}(?:将被|会被|已被|被)(?:冻结|暂停|停用|锁定|注销|关闭|限制)/,
    /(?:逮捕|拘留|通缉|法律责任|起诉|坐牢|洗钱)/
  ] },
  urgency: { reason: "催促您马上行动", patterns: [
    /\d+\s*(?:分钟|小时|天)内/,
    /(?:立即|立刻|马上|尽快|紧急|限时|最后机会|名额有限|今天之内|今日内)/
  ] },
  secrecy: { reason: "要您保守秘密", patterns: [
    /(?:请不要|不要|别|请勿|切勿)(?:告诉|通知|让)(?:任何人|别人|家人|你的家人|您的家人|朋友|银行|警察)/,
    /(?:对|向)(?:家人|家里人|银行|警察|任何人)保密/
  ] },
  asks_code: { reason: "要您提供验证码、密码或PIN", patterns: [
    /(?:回复|发送|提供|告诉|输入|转发|报)[^。！？，；\n]{0,8}(?:验证码|动态码|密码|OTP|otp|PIN|安全码|一次性密码)/
  ] },
  asks_details: { reason: "要您填写个人或银行资料", patterns: [
    /(?:更新|验证|核实|确认|完善|填写|提交)[^。！？，；\n]{0,6}(?:资料|信息|身份|账户|帐户|银行卡|卡号|账号)/
  ] },
  tap_link: { reason: "催您点击链接", patterns: [/(?:点击|点开|打开|登录|登入)[^。！？，；\n]{0,6}(?:链接|网址|网站|以下|下方)/] },
  pay_fee: { reason: "要您先付一笔费用", patterns: [
    /(?:支付|缴纳|交|付)[^。！？，；\n]{0,10}(?:手续费|派送费|运费|保证金|押金|关税|报名费|费用)/,
    /(?:派送费|运费|手续费|报名费|保证金|激活费|解冻费|清关费)/
  ] },
  send_money: { reason: "要您转钱", patterns: [
    /(?:转账|汇款|打款|转钱|汇钱|把钱转)/,
    /(?:急需|需要|借)[^。！？，；\n]{0,4}\d[\d,]*\s*(?:元|块|新币|美元|令吉)/
  ] },
  safe_account: { reason: "要您把钱转到“安全账户”，真正的银行绝不会这样做", patterns: [
    /(?:安全账户|安全帐户|保护账户|监管账户|清查账户|指定账户)/
  ] },
  gift_card: { reason: "要您买礼品卡，骗子喜欢它因为无法追查", patterns: [/(?:礼品卡|充值卡|购物卡|游戏卡)/] },
  install_app: { reason: "要您安装应用程序，骗子可能借此控制您的手机", patterns: [
    /(?:下载|安装)[^。！？，；\n]{0,10}(?:apk|APK)/,
    /(?:点击|通过)(?:链接|以下链接)[^。！？，；\n]{0,6}(?:下载|安装)/,
    /(?:远程控制|屏幕共享|共享屏幕)/
  ] },
  private_chat: { reason: "把您转到私人聊天软件", patterns: [
    /(?:加|添加|联系)[^。！？，；\n]{0,4}(?:WhatsApp|whatsapp|Telegram|telegram|微信|电报|LINE)/
  ] },
  call_or_text: { reason: "要您拨打它给的号码", patterns: [/(?:致电|拨打|联系|回电)[^。！？，；\n]{0,10}\+?\d[\d -]{6,}\d/] },
  prize: { reason: "说您中奖了，好得不像真的", patterns: [
    /(?:恭喜您?(?:中奖|获得|成为|被选中)|中奖|领奖|领取奖品|幸运(?:用户|会员|客户)|被抽中|抽中)/
  ] },
  refund: { reason: "说要给您一笔您没要求的钱", patterns: [
    /(?:领取|申领|申请)[^。！？，；\n]{0,4}(?:退款|退税|补贴|赔偿|津贴)/
  ] },
  job_offer: { reason: "主动给您介绍工作", patterns: [/(?:兼职|在家工作|网上工作|居家办公|招聘)/] },
  job_lure: { reason: "说做一点点事就能轻松赚钱", patterns: [
    /(?:每天|每日|一天|每小时)[^。！？，；\n]{0,6}(?:赚|挣)[^。！？，；\n]{0,3}\d+/,
    /(?:日赚|日入)\s*\d+/,
    /(?:无需经验|不需要经验|零经验|轻松赚钱|躺赚)/
  ] },
  task_job: { reason: "为简单的网上任务付钱，这是常见的求职诈骗", patterns: [/(?:点赞|刷单|做任务|刷好评)/] },
  investment_lure: { reason: "保证高回报，真正的投资做不到", patterns: [
    /(?:保证|稳赚|保本|零风险|无风险)[^。！？，；\n]{0,6}(?:回报|收益|利润|盈利|赚)/,
    /\d+\s*%\s*(?:的)?(?:回报|收益|利润|利息)/,
    /(?:炒币|虚拟货币|加密货币|比特币|外汇|股票)[^。！？，；\n]{0,4}(?:群|平台|投资|导师|老师)/,
    /(?:VIP|vip)\s*(?:群|会员)/,
    /(?:翻倍|稳赚不赔)/
  ] },
  love_words: { reason: "用亲密的话赢得您的信任", patterns: [/(?:亲爱的|宝贝|甜心)/] },
  sad_story: { reason: "讲一个被困的故事，让您同情", patterns: [
    /(?:机场|海关|医院|边境|国外)[^。！？，；\n]{0,4}(?:被扣|扣留|被困|困住|出事)/
  ] },
  notice_bait: { reason: "含糊的通知，引您回复", patterns: [
    /您有(?:一|1|\d+)(?:个|条|件)(?:新|未读|待处理)?(?:语音|留言|消息|包裹|快递)/
  ] },
  parcel_problem: { reason: "说您的快递出了问题", patterns: [
    /(?:包裹|快递|货物|邮件)[^。！？，；\n]{0,8}(?:无法|未能|不能|失败|滞留|退回|暂扣|扣留)/,
    /(?:重新派送|重新投递|二次派送)/
  ] },
  // Links: reason only (links are found the same way in every language)
  has_link: { reason: "含有链接，点击前请先确认它真正通往哪里" },
  suspicious_link: { reason: "这个链接看起来不像官方网站" }
};

// Works in the browser (as a global) and in Node (with require)
if (typeof module === "object" && module.exports) {
  module.exports = RULES_ZH;
} else {
  globalThis.TEXT_DETECTOR_RULES_ZH = RULES_ZH;
}
