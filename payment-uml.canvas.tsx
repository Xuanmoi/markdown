import {
  Card,
  CardBody,
  CardHeader,
  Code,
  Divider,
  Grid,
  H1,
  H2,
  Pill,
  Row,
  Stack,
  Table,
  Text,
  useHostTheme,
} from "cursor/canvas";

const paymentMethodRows = [
  [
    "Stripe",
    "stripe_payments",
    "需要初始化 Stripe SDK 与 Elements；选择后渲染 card-element。",
    "点击下单前会先 elements.submit 校验；下单成功后 create-stripe-payment-order，再 capture/check 状态。",
  ],
  [
    "PayPal",
    "paypal_rest",
    "支付配置返回 paypal_rest 后，使用 PayPal client_key 初始化按钮。",
    "PayPal SDK 按钮是下单入口；createOrder 可能先生成订单，再创建 PayPal 支付单；approve 后 capture/check。",
  ],
  [
    "PayPal Later",
    "paypal_later",
    "和 PayPal 共用 SDK，但 fundingSource 使用 PAYLATER；渲染失败会标记不支持。",
    "PayPal Later SDK 按钮是下单入口；如果当前选择 PayPal Later 但按钮不支持，会自动切换到 paypal_rest。",
  ],
  [
    "Adyen",
    "adyen-*",
    "后端返回 adyen 容器方法，前端展开为 adyen-scheme / applepay / googlepay / afterpay / affirm 等子方法。",
    "下单前校验子组件；下单成功后 submit Adyen 组件，onSubmit 创建 Adyen 支付单。",
  ],
  [
    "Ebanx",
    "ebanx",
    "支付方式列表中独立展示，支持图标与选择。",
    "下单成功后 create-ebanx-payment-order；成功拿 redirect_url 跳转，异常按错误码回退。",
  ],
];

const initializationRows = [
  [
    "触发时机",
    "Checkout.vue `initPayment`",
    "Shipping Step 完成后触发；首次进入或 shipping country 变化时才重新加载支付方式。",
  ],
  [
    "加载配置",
    "usePaymentProvider.load",
    "GET payment-config/get-available-payment-method，参数包含 country、price、quoteId、session_type。",
  ],
  [
    "Stripe 初始化",
    "usePaymentView.initStripe / initStripePayment",
    "payment methods 中存在 stripe_payments 且 client_key 变化时，清空旧实例并重新 loadStripe；选中 Stripe 时渲染 Elements。",
  ],
  [
    "PayPal 初始化",
    "usePaymentView.loadPaypalForCheckout",
    "payment methods 中存在 paypal_rest 且 client_key 变化时，清空按钮容器并加载 PayPal / PayPal Later 按钮。",
  ],
  [
    "Adyen 初始化",
    "usePaymentView.initAdyenCheckout",
    "payment methods 中存在 adyen 时，每次都重新初始化；原因是国家变化会影响 Afterpay / Affirm 等子支付方式。",
  ],
  [
    "列表展示",
    "VsfPaymentProvider + sortPaymentMethods",
    "把 adyen 容器方法过滤掉，再拼接展开后的 adyen 子方法；展示顺序由 sortPaymentMethods 控制。",
  ],
];

const selectionRows = [
  [
    "保存支付方式",
    "VsfPaymentProvider `definePaymentMethods`",
    "调用 setPaymentMethodOnCart；成功后更新 quote.selected_payment_method、prices、applied_exemption、coupons、cart_errors。",
  ],
  [
    "Adyen 参数转换",
    "VsfPaymentProvider `definePaymentMethods`",
    "选中 adyen-scheme / adyen-applepay 等子方式时，保存到 quote 的 code 是 adyen，并带 adyen.payment_method。",
  ],
  [
    "Billing 地址",
    "VsfPaymentProvider `switchPaymentMethod`",
    "若支付方式 require_billing=false 且当前是独立 billing，会恢复 shippingSameAsBilling=true 并保存 shipping 作为 billing。",
  ],
  [
    "选中方式失效",
    "VsfPaymentProvider watch(currentPaymentMethods)",
    "如果当前 selectedPaymentMethodCode 已不在最新支付方式列表中，自动降级选择第一个可用支付方式。",
  ],
  [
    "Stripe Loading",
    "VsfPaymentProvider / CartPreview",
    "非 Stripe 支付方式会清理 isLoadingStripe；Place Order 会受 Stripe / Adyen card loading 状态禁用。",
  ],
];

const placeOrderRows = [
  [
    "普通下单按钮可点",
    "CartPreview `placeOrderDisabled`",
    "非 PayPal 按钮路径需要 shipping 地址有效、已选配送方式、Shipping Step completed、已选支付方式，且支付组件不在 loading。",
  ],
  [
    "Stripe 前置校验",
    "Checkout.vue `placeOrder`",
    "选中 Stripe 时先执行 stripeCheckBeforePlaceOrder；Elements 不存在或字段无效会提示并中止。",
  ],
  [
    "Adyen 前置校验",
    "Checkout.vue `placeOrder`",
    "选中 adyen-* 时获取对应组件实例，先 showValidation；实例无效则中止。",
  ],
  [
    "刷新 Quote",
    "Checkout.vue `placeOrder`",
    "前置校验通过后 loadQuoteById(quoteId, true)，用最新报价单继续下单；失败时提示并停留 Checkout。",
  ],
  [
    "生成订单",
    "useMakeOrder.make",
    "调用 placeOrderV2，传 cart_id 和 purchase_order_number。",
  ],
  [
    "订单成功后",
    "Checkout.vue `placeOrder`",
    "记录 order_number / uuid、affiliate、pending order；普通 quote 会刷新登录购物车或清空匿名购物车。",
  ],
];

const stripeRows = [
  [
    "初始化",
    "initStripe / initStripePayment",
    "按 grand_total 和 currency 初始化 Stripe Elements；金额会按货币是否零小数做转换。",
  ],
  [
    "下单前 Stripe 表单校验",
    "stripeCheckBeforePlaceOrder",
    "点击普通 Place Order 且选中 Stripe 时先执行 `elements.submit()`；Stripe 组件会调用第三方校验，返回 error 且有 type 时提示错误并中止，不刷新 quote、不生成订单。",
  ],
  [
    "邮箱验证前置差异",
    "Checkout.vue / OrderCheckout.vue",
    "Checkout 新下单路径没有单独在 `placeOrder` 后立刻查询邮箱锁；OrderCheckout 待支付订单路径会在扣款前调用 `jumpToEmailVerifyModal()`，锁定时打开邮箱验证弹窗并中止。",
  ],
  [
    "创建 PaymentMethod",
    "confirmStripePayment",
    "调用 `stripe.createPaymentMethod({ elements, billing_details })`，账单地址来自订单/quote billing address，email 来自 quote/order email。",
  ],
  [
    "PaymentMethod 错误处理",
    "confirmStripePayment",
    "如果 response.error 有 type，抛出并提示；如果无 type 但包含 paymentMethod.id/type，仍写入 `stripePaymentInfo`；如果没有可用 payment method id，则抛出并提示。",
  ],
  [
    "创建支付单",
    "createStripePaymentOrder",
    "只有 `stripePaymentInfo` 有值才继续；传 order_number、pm_id、return_url 创建 Stripe payment intent，成功后保存 client_secret。",
  ],
  [
    "订单已取消/已支付",
    "stripeDeductingMoney",
    "`createStripePaymentOrder` 返回 `ORDER_CANCELED` / `ORDER_PAID` 时提示并中止；登录用户去订单详情，匿名用户去首页。",
  ],
  [
    "创建支付单异常",
    "stripeDeductingMoney",
    "非上述状态且 code !== 1 时，如果是 `EMAIL_VERIFICATION` 会先触发 `emailCheckCallback`；无论是否邮箱验证都会展示 `stripeOrderResult.info`，关闭 mask；若当前不在收银台页则跳收银台页。",
  ],
  [
    "捕获与 3DS",
    "captureOrderStatus / stripe.handleNextAction",
    "创建支付单成功后调用 capture；code !== 1 时先提示错误。若不是 `ORDER_REQUIRE_3DS`，中止流程；若需要 3DS，则调用 `stripe.handleNextAction({ clientSecret })`。",
  ],
  [
    "3DS 后二次捕获",
    "stripeDeductingMoney",
    "站内 3DS 没有 paymentIntent 或返回 error 时提示，并在当前不在收银台页时跳收银台；站内 3DS 成功后再次 capture，若仍失败也按同样规则跳收银台，否则进入支付状态检查。",
  ],
  [
    "站外 3DS Return",
    "Checkout/Return.vue",
    "站外验证会跳回 `/checkout/return/:id`。链接携带 `payment_intent` 或 `payment_intent_client_secret` 时进入 Stripe Klarna/Affirm 分支；当前代码在 `redirect_status=failed` 时直接提示 `payment.3ds.failed` 并跳收银台，否则先 capture 再 checkPaymentStatus。",
  ],
  [
    "Return 普通轮询",
    "Checkout/Return.vue",
    "如果链接没有 Stripe payment intent 参数，但 `check_status=true`，执行 `reCheckOrderStatusUtilDone()` 轮询订单状态；参数不完整或异常时提示并跳收银台。",
  ],
  [
    "成功检查",
    "checkOrderPaymentStatus",
    "`checkPaymentStatus` 返回 code=1 表示数据库查询成功；order_status 非 pending 跳成功页，pending 且不在 return 页则跳 return 页轮询。",
  ],
  [
    "Return 页轮询",
    "reCheckOrderStatusUtilDone",
    "return 页每 1 秒检查一次，最多 30 秒；状态非 pending 跳成功页，code=0 提示错误，并在当前不在收银台页时跳收银台。当前代码 30 秒超时会跳成功页。",
  ],
];

const paypalRows = [
  [
    "SDK 加载",
    "PaypalManager",
    "按 currency + clientId 缓存 PayPal SDK 实例；同一 key/currency 复用初始化结果。",
  ],
  [
    "PayPal 按钮",
    "loadPaypalButton",
    "fundingSource=PAYPAL；createOrder 使用 payment_type_code=paypal_rest。",
  ],
  [
    "PayPal Later 按钮",
    "loadPaypalButtonPAYLATER",
    "fundingSource=PAYLATER；createOrder 使用 payment_type_code=paypal_later。",
  ],
  [
    "按钮渲染失败",
    "loadPaypalButtonPAYLATER.then(rejected)",
    "设置 isSupportPayLatter=false；如果当前选中 paypal_later 且存在 paypal_rest，自动切换到 paypal_rest。",
  ],
  [
    "误点内部 Place Order",
    "Checkout.vue / OrderCheckout.vue `startDeductingMoney`",
    "当 selectedPaymentMethodCode 是 paypal_rest/paypal_later 但用户触发的是项目内部按钮时，提示 `paypal.load.error`；Checkout 页会跳收银台，OrderCheckout 页已在收银台则只提示。",
  ],
  [
    "Checkout 页 SDK createOrder",
    "usePaymentView.createOrder",
    "如果 orderUUID 不存在，先 `loadQuoteById(quoteId, true)` 刷新报价单；失败则提示并中止。刷新成功后调用 `placeOrderV2` 生成订单，失败则提示并中止。",
  ],
  [
    "订单生成后清理",
    "usePaymentView.createOrder",
    "订单创建成功后保存 uuid/order_number，触发 affiliate；Buy Now 清理本地 cart id；普通 quote 登录刷新购物车、匿名清空购物车，并清理 cart coupon/cart errors；随后写 pending order。",
  ],
  [
    "OrderCheckout 邮箱验证",
    "usePaymentView.createOrder",
    "如果 orderUUID 已存在，说明在收银台待支付路径；创建 PayPal 支付单前调用 `emailCheckCallback`，返回 `ORDER_LOCKED` 时打开邮箱验证弹窗并中止。",
  ],
  [
    "创建 PayPal 支付单",
    "createPaypalPaymentOrder",
    "传 order_number、payment_type_code、cancel_url、return_url；code=1 时返回 `trans_id` 给 PayPal SDK。",
  ],
  [
    "PayPal 支付单异常",
    "usePaymentView.createOrder",
    "返回 ORDER_CANCELED / ORDER_PAID 时提示并中止，登录用户去订单详情，匿名用户去首页；其他 code !== 1 时如果是 EMAIL_VERIFICATION 会触发邮箱验证回调，但无论如何都会提示 data.info 并中止。",
  ],
  [
    "onApprove",
    "usePaymentView.onApprove",
    "用户在 PayPal 窗口授权后调用 `captureOrderStatus`；code !== 1 表示捕获失败，展示 message/info，Checkout/BuyNow 页跳收银台；code=1 后进入 `checkOrderPaymentStatus`。",
  ],
  [
    "支付状态检查",
    "checkOrderPaymentStatus / reCheckOrderStatusUtilDone",
    "checkPaymentStatus code=1 表示数据库查询成功；order_status 非 pending 进成功页，pending 且不在 return 页则跳 return 轮询；return 页每秒轮询，超过 30 秒或状态非 pending 进成功页，code=0 提示并跳收银台。",
  ],
  [
    "onCancel / onError",
    "usePaymentView",
    "用户取消时 Checkout/BuyNow 页带确认提示跳收银台；非取消错误且已有 orderUUID 时，Checkout/BuyNow 页跳收银台。",
  ],
];

const paypalInstallmentRows = [
  [
    "分期信息组件",
    "PayLaterMessage.vue",
    "用于展示 PayPal Later 分期文案；通过 `paypal.Messages` 渲染，参数包含 amount、placement、currency、buyerCountry。",
  ],
  [
    "Checkout 展示位置",
    "CartPreview.vue",
    "`paypalKey && totals.total` 时在 summary 中渲染 `PayLaterMessage`，amount 使用 quote totals.total，placement=payment；下方同一区域根据支付方式展示 PayPal / Pay Later 按钮容器。",
  ],
  [
    "OrderCheckout 展示位置",
    "OrderPreview.vue",
    "`paypalKey` 存在且未移除下单按钮时渲染 `PayLaterMessage`，amount 使用 order totals，currency 使用订单 currency。",
  ],
  [
    "消息 client key 来源",
    "PayLaterMessage.vue / usePayKey",
    "组件优先使用传入的 `paypalKey`；没有传入时调用 `getPayLaterMessageKey` 请求 `paypal-later-client-config` 并缓存到 configStore.paypalMessageKey。",
  ],
  [
    "货币选择",
    "PayLaterMessage.vue / PaypalManager",
    "组件优先使用 props.currency；未传入时用 `getDefaultCurrencyCode`。PaypalManager 只在 EUR、GBP、MXN、CAD、AUD、USD、PLN 内向 SDK 传 currency。",
  ],
  [
    "SDK 缓存",
    "usePaypal2.ts `PaypalManager`",
    "PayPal SDK 实例按 `${currency}-${paypalKey}` 缓存在 `instanceMap`；初始化中的 promise 也会复用，失败时清空 promise 允许重试。",
  ],
  [
    "按钮容器",
    "CartPreview.vue / OrderPreview.vue",
    "PayPal 按钮渲染到 `#paypal-button-container`；Pay Later 按钮渲染到 `#paypal-latter-button-container`。",
  ],
  [
    "PayPal 按钮可见性",
    "CartPreview.vue / OrderPreview.vue",
    "selectedPaymentMethodCode=paypal_rest 且 `quoteStore.isSupportPaypal=true` 时展示 PayPal 按钮；Checkout 页还要求 shipping 地址、shipping method、shipping step completed。",
  ],
  [
    "Pay Later 按钮可见性",
    "CartPreview.vue / OrderPreview.vue / VsfPaymentProvider.vue",
    "selectedPaymentMethodCode=paypal_later 且 `quoteStore.isSupportPayLatter=true` 时展示 Pay Later 按钮；VsfPaymentProvider 也会根据 isSupportPayLatter 隐藏或展示 paypal_later 支付项。",
  ],
  [
    "Pay Later 不支持降级",
    "loadPaypalButtonPAYLATER",
    "Pay Later 按钮 render 失败时设置 `isSupportPayLatter=false`；若当前选中 paypal_later 且存在 paypal_rest，则自动切换到 paypal_rest。",
  ],
];

const adyenRows = [
  [
    "方法展开",
    "getAdyenPaymentMethods",
    "scheme 映射 adyen-scheme 且 require_billing=true；affirm/afterpay/applepay/googlepay 等映射为独立子支付方式。",
  ],
  [
    "可用性过滤",
    "GooglePay / ApplePay isAvailable",
    "Google Pay 和 Apple Pay 需要先执行 isAvailable，失败则不进入支付方式列表。",
  ],
  [
    "组件加载",
    "AdyenCard / Adyen* components",
    "选中 adyen 子方式后渲染对应组件；AdyenCard onLoad 后写入实例并关闭 card loading。",
  ],
  [
    "下单前校验",
    "Checkout.vue `placeOrder` / OrderCheckout.vue `startDeductingMoney`",
    "Checkout 新下单路径会在刷新 quote、生成订单前执行 showValidation；OrderCheckout 待支付订单路径也会先 showValidation。实例 invalid 时直接中止。",
  ],
  [
    "OrderCheckout 邮箱锁",
    "OrderCheckout.vue `startDeductingMoney`",
    "待支付订单页选中非 Apple Pay 的 adyen-* 时，提交组件前调用 jumpToEmailVerifyModal；返回 ORDER_LOCKED 时打开邮箱验证弹窗并中止。",
  ],
  [
    "提交支付",
    "handleAdyenPay",
    "Checkout 新下单路径生成订单后提交 Adyen 实例；Apple Pay 在 handleAdyenPay 中不 submit，直接跳收银台并关闭 pageMask；submit 异常时提示 adyen.payment.failed，不在收银台页时跳收银台。",
  ],
  [
    "创建 Adyen 支付单",
    "initAdyenCheckout onSubmit",
    "onSubmit 开启 pageMask；Afterpay 的 paymentMethod.type 从 afterpay_default 转成 afterpaytouch；传 order_number、return_url、payment_method、browser_info、risk_data 调 create-adyen-payment-order。",
  ],
  [
    "订单已取消 / 已支付",
    "initAdyenCheckout onSubmit",
    "createAdyenPaymentOrder 返回 ORDER_CANCELED 或 ORDER_PAID 时设置 isPurchaseOrder，展示 warning，中止；登录用户或客户订单跳订单详情，匿名用户跳首页。",
  ],
  [
    "邮箱验证错误",
    "initAdyenCheckout onSubmit",
    "返回 EMAIL_VERIFICATION 时触发邮箱验证回调，然后 component.setStatus('ready')、展示接口错误、关闭 pageMask 并中止。",
  ],
  [
    "支付单创建异常",
    "initAdyenCheckout onSubmit",
    "没有 result_code 时 actions.reject、component.setStatus('ready')、展示接口错误、关闭 pageMask 并中止。",
  ],
  [
    "支付单创建成功",
    "initAdyenCheckout onSubmit",
    "拿到 result_code/action 后 actions.resolve；如果 OrderCheckout 且 action.type=redirect，会先 removeHandleBeforeUnload，后续 action 由 Adyen SDK 处理。",
  ],
  [
    "站内完成",
    "onPaymentCompleted / onPaymentFailed / onError",
    "onPaymentCompleted 调 captureOrder；capture 失败则展示错误，Checkout 新下单路径不在收银台页时跳收银台；capture 成功后跳 /checkout/adyen/return 轮询。",
  ],
  [
    "站内失败 / SDK 错误",
    "onPaymentFailed / onError",
    "支付失败时，如果 element.type=googlepay，直接 return，停留在当页等待用户再次与 Google Pay 交互；如果 data.resultCode=Refused，展示 adyen.payment.failed；随后如果不在收银台页则前往收银台页，如果已在收银台页则 element.setStatus('ready')，关闭 pageMask 并中止。",
  ],
  [
    "站外 Redirect 返回",
    "Checkout/AdyenReturn.vue",
    "缺少 orderUUID/orderNumber 跳首页；有 redirectResult 时先 adyenAuthReport 验签，失败或无 data 均提示并跳收银台；验签通过后 captureOrder，如果数据库查询失败则提示并跳收银台，除此之外进入 reCheckOrderStatusUtilDone 轮询。",
  ],
];

const ebanxRows = [
  [
    "选择支付方式",
    "VsfPaymentProvider",
    "Ebanx 作为普通 payment method 进入列表；isShowSupportMethods 会展示 EBANX_SUPPORT_PAYMENTS 图标。",
  ],
  [
    "下单后入口",
    "Checkout.vue / OrderCheckout.vue `startDeductingMoney`",
    "Checkout 新下单路径在 Place Order 成功、清理购物车和本地邮箱后进入 handleEbanxPayment；OrderCheckout 待支付订单页选中 ebanx 时设置 isContinueLeave=true，再进入 handleEbanxPayment。",
  ],
  [
    "创建支付单",
    "handleEbanxPayment",
    "拼接 returnOrderId=orderNumber===orderUUID，开启 pageMask；调用 create-ebanx-payment-order，传 order_number 和 /payment/processing/:returnOrderId 作为 return_url。",
  ],
  [
    "跳转支付",
    "handleEbanxPayment",
    "返回 code=1 且有 redirect_url 时，window.location.href 跳转第三方支付页；如果 code=1 但没有 redirect_url，当前实现不会主动回退，只会停留在 pageMask 状态，属于需要补充的边界。",
  ],
  [
    "创建支付单异常",
    "handleEbanxPayment catch",
    "任意非 code=1 都进入 catch，关闭 pageMask、记录 sentry、展示 error.message，再按错误码分支处理。",
  ],
  [
    "取消上一笔失败",
    "handleEbanxPayment catch",
    "CANCEL_FAILED 表示 Ebanx 订单处于 CO（用户正在支付或已支付）状态，直接跳 payment-processing 页面，不回收银台。",
  ],
  [
    "订单已取消 / 已支付",
    "handleEbanxPayment catch",
    "ORDER_CANCELED 或 ORDER_PAID 时，如果是客户订单跳订单详情，否则跳首页。",
  ],
  [
    "其他异常",
    "handleEbanxPayment catch",
    "不是上述错误码且当前不在 orderCheckout 页时，不在收银台页时跳收银台；如果已经在 orderCheckout 页，则停留当前页。",
  ],
  [
    "处理页初始化",
    "PaymentProcessing.vue",
    "从路由 id 解析 orderNumber/orderUUID；onMounted 先清除 quote coupon/cart errors；缺少参数跳首页；参数正常则 start 轮询。",
  ],
  [
    "处理页轮询",
    "PaymentProcessing.vue",
    "首次 check 使用 captureOrder，后续使用 checkPaymentStatus；没有 status、没有 order_status 或 order_status=pending 时 1 秒后继续轮询。",
  ],
  [
    "处理页手动离开",
    "PaymentProcessing.vue",
    "处理页提供 `Order.Detail` 按钮，点击后调用 handleOrderDetails，可离开当前处理页并前往订单详情。",
  ],
  [
    "处理页完成",
    "PaymentProcessing.vue",
    "拿到 status 且订单不是 pending 时，写入 cartStore.orderId、清除 pending order，replace 到 checkout-success。",
  ],
  [
    "处理页异常",
    "PaymentProcessing.vue",
    "PAYMENT_ORDER_NOT_FOUND 跳订单详情；接口抛错时 3 秒后重试；组件卸载时停止定时器。",
  ],
];

const errorRows = [
  [
    "支付方式加载失败",
    "usePaymentProvider.load",
    "记录 sentry error，返回 null；页面没有可展示 payment methods 时显示 PlaceholderPayment 或空列表。",
  ],
  [
    "保存支付方式授权失效",
    "usePaymentProvider.save",
    "CART_AUTHORIZATION_FAILED 提示登录过期并返回购物车；CART_NOT_FOUND 也提示并返回购物车。",
  ],
  [
    "下单接口失败",
    "Checkout.vue `placeOrder` / createOrder",
    "提示错误 message，关闭 pageMask，停留当前 Checkout 或 PayPal 按钮链路返回 undefined。",
  ],
  [
    "订单已取消/已支付",
    "Stripe / PayPal / Adyen / Ebanx",
    "统一按错误码处理：设置 isPurchaseOrder 或提示，登录用户多跳订单详情，匿名用户多跳首页。",
  ],
  [
    "邮箱验证",
    "Stripe / PayPal / Adyen",
    "返回 EMAIL_VERIFICATION 时触发 emailCheckCallback，提示后中止当前扣款动作。",
  ],
  [
    "扣款失败",
    "Stripe / PayPal / Adyen",
    "展示支付服务错误；多数场景跳 orderCheckout 收银台页，允许用户继续处理待支付订单。",
  ],
];

function UmlStartEnd({ label, end = false }: { label: string; end?: boolean }) {
  const theme = useHostTheme();
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          minWidth: 110,
          height: 34,
          padding: "0 14px",
          borderRadius: 999,
          border: `2px solid ${end ? theme.accent.primary : theme.stroke.primary}`,
          background: end ? theme.fill.secondary : theme.bg.elevated,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 600,
          color: theme.text.primary,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function UmlAction({ title, note }: { title: string; note?: string }) {
  const theme = useHostTheme();
  return (
    <div
      style={{
        border: `1px solid ${theme.stroke.secondary}`,
        borderRadius: 8,
        background: theme.bg.elevated,
        padding: "10px 12px",
        textAlign: "center",
      }}
    >
      <Text weight="semibold" style={{ margin: 0 }}>
        {title}
      </Text>
      {note ? (
        <Text tone="secondary" size="small" style={{ margin: "4px 0 0" }}>
          {note}
        </Text>
      ) : null}
    </div>
  );
}

function UmlDecision({ title }: { title: string }) {
  const theme = useHostTheme();
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
      <div
        style={{
          width: 124,
          height: 124,
          transform: "rotate(45deg)",
          border: `1px solid ${theme.accent.primary}`,
          background: theme.fill.secondary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          weight="semibold"
          style={{
            transform: "rotate(-45deg)",
            textAlign: "center",
            width: 92,
            margin: 0,
            lineHeight: 1.25,
          }}
        >
          {title}
        </Text>
      </div>
    </div>
  );
}

function UmlArrow() {
  const theme = useHostTheme();
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 22 }}>
      <div style={{ color: theme.text.secondary, fontSize: 18, lineHeight: "18px" }}>↓</div>
    </div>
  );
}

function UmlBranch({ label, children }: { label: string; children: any }) {
  const theme = useHostTheme();
  return (
    <div
      style={{
        border: `1px solid ${theme.stroke.secondary}`,
        borderRadius: 10,
        padding: 12,
        background: theme.bg.default,
        minHeight: 1,
      }}
    >
      <Row gap={8} align="center" style={{ marginBottom: 8 }}>
        <Pill>{label}</Pill>
      </Row>
      <Stack gap={8}>{children}</Stack>
    </div>
  );
}

export default function PaymentUmlCanvas() {
  return (
    <Stack gap={18}>
      <div>
        <H1>支付 UML</H1>
        <Text tone="secondary">
          覆盖 checkout 支付方式初始化、选择支付方式、下单前校验、生成订单后的扣款分流，以及 Stripe、PayPal、PayPal Later、Adyen、Ebanx 的差异化处理。
        </Text>
      </div>

      <Stack gap={10}>
        <H2>支付方式总览</H2>
        <Table headers={["支付方式", "代码", "初始化/展示", "下单后处理"]} rows={paymentMethodRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：初始化与支付方式列表</H2>
        <Card>
          <CardHeader>Shipping Done 后初始化支付</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="Shipping Step 完成" />
              <UmlArrow />
              <UmlDecision title="首次或国家变化？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="否">
                  <UmlAction title="不重新加载支付方式" note="isFirstInitPayment=false 且 country 未变化" />
                </UmlBranch>
                <UmlBranch label="是">
                  <UmlAction title="loadPaymentMethods" note="country、price、quoteId 请求支付配置" />
                  <UmlArrow />
                  <UmlAction title="初始化第三方 SDK" note="Stripe / PayPal / Adyen 按返回 method 初始化" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="合并展示列表" note="过滤 adyen 容器方法，拼接展开后的 adyen 子支付方式" />
              <UmlArrow />
              <UmlStartEnd label="Payment Methods 可选" end />
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["环节", "代码位置", "规则"]} rows={initializationRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：选择支付方式</H2>
        <Card>
          <CardHeader>VsfPaymentProvider</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="用户选择支付方式" />
              <UmlArrow />
              <UmlDecision title="是否 require_billing=false？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="是">
                  <UmlAction title="恢复 same as shipping" note="如之前独立 billing，则保存 shipping 作为 billing" />
                </UmlBranch>
                <UmlBranch label="否">
                  <UmlAction title="允许独立 BillingStep" note="如 Stripe / adyen-scheme 可编辑 billing address" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="是否 Adyen 子方式？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="是">
                  <UmlAction title="转换保存参数" note="code=adyen，adyen.payment_method=子方式" />
                </UmlBranch>
                <UmlBranch label="否">
                  <UmlAction title="原样保存 code" note="stripe_payments / paypal_rest / paypal_later / ebanx" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="setPaymentMethodOnCart" note="更新 quote.selected_payment_method 与价格相关字段" />
              <UmlArrow />
              <UmlStartEnd label="支付方式保存完成" end />
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["场景", "代码位置", "规则"]} rows={selectionRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：Place Order 通用入口</H2>
        <Card>
          <CardHeader>普通按钮路径，不含 PayPal SDK 按钮</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="点击普通 Place Order" />
              <UmlArrow />
              <UmlDecision title="支付组件前置校验？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="Stripe / Adyen">
                  <UmlAction title="先校验组件" note="Stripe elements.submit；Adyen showValidation" />
                  <UmlArrow />
                  <UmlAction title="校验失败则停留" note="不刷新 quote，不调用 placeOrder" />
                </UmlBranch>
                <UmlBranch label="其他方式">
                  <UmlAction title="无前置组件校验" note="Ebanx 等普通按钮路径直接刷新 quote；PayPal 走 SDK createOrder" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="loadQuoteById(quoteId, true)" note="强制用最新报价单继续下单" />
              <UmlArrow />
              <UmlDecision title="quote 刷新成功？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="否">
                  <UmlAction title="提示并停留 Checkout" note="关闭 pageMask，用户继续调整" />
                </UmlBranch>
                <UmlBranch label="是">
                  <UmlAction title="placeOrderV2" note="生成 order_number / orderUUID" />
                  <UmlArrow />
                  <UmlAction title="按 selected_payment_method 分流" note="Stripe / PayPal / Adyen / Ebanx" />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["环节", "代码位置", "规则"]} rows={placeOrderRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：Stripe</H2>
        <Card>
          <CardHeader>Stripe Card</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="点击 Place Order" />
              <UmlArrow />
              <UmlAction title="Stripe Elements submit" note="第三方组件内置表单提交与字段校验" />
              <UmlArrow />
              <UmlDecision title="表单是否有效？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="无效">
                  <UmlAction title="提示 Stripe 错误" note="response.error.type 存在时展示 message" />
                  <UmlArrow />
                  <UmlStartEnd label="中止流程" end />
                </UmlBranch>
                <UmlBranch label="有效">
                  <UmlAction title="继续通用下单" note="loadQuoteById -> placeOrderV2 -> 保存 orderNumber/orderUUID" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="是否需要邮箱验证？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="OrderCheckout 待支付路径">
                  <UmlAction title="jumpToEmailVerifyModal" note="订单锁定时打开邮箱验证弹窗，返回 ORDER_LOCKED 则中止" />
                </UmlBranch>
                <UmlBranch label="Checkout 新下单路径">
                  <UmlAction title="无独立前置锁查询" note="后续 createStripePaymentOrder 若返回 EMAIL_VERIFICATION 再触发回调" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="stripe.createPaymentMethod" note="传 elements + 订单账单地址 + email" />
              <UmlArrow />
              <UmlDecision title="PaymentMethod 响应是否可用？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="错误且不可恢复">
                  <UmlAction title="抛出并提示" note="error.type 存在，或没有 paymentMethod.id" />
                  <UmlArrow />
                  <UmlStartEnd label="不在收银台页时跳收银台" end />
                </UmlBranch>
                <UmlBranch label="可用">
                  <UmlAction title="更新 stripePaymentInfo" note="保存 paymentMethodId / paymentType 给后续接口" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="createStripePaymentOrder" note="order_number + pm_id + return_url，成功返回 client_secret" />
              <UmlArrow />
              <UmlDecision title="支付单创建结果？" />
              <Grid columns={3} gap={16}>
                <UmlBranch label="成功">
                  <UmlAction title="保存 client_secret" note="支付意向单创建成功，进入 capture" />
                </UmlBranch>
                <UmlBranch label="订单取消/已付款">
                  <UmlAction title="提示并中止" note="ORDER_CANCELED / ORDER_PAID；登录去订单详情，匿名去首页" />
                  <UmlArrow />
                  <UmlStartEnd label="中止流程" end />
                </UmlBranch>
                <UmlBranch label="接口异常">
                  <UmlAction title="EMAIL_VERIFICATION 时触发邮箱验证回调" note="code=EMAIL_VERIFICATION -> emailCheckCallback" />
                  <UmlArrow />
                  <UmlAction title="始终展示接口错误信息" note="FpMessage.error(stripeOrderResult.info)，关闭 pageMask" />
                  <UmlArrow />
                  <UmlStartEnd label="不在收银台页时跳收银台" end />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="captureOrderStatus" note="扣款 + 捕获订单状态" />
              <UmlArrow />
              <UmlDecision title="capture 是否成功？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="成功">
                  <UmlAction title="checkOrderPaymentStatus" note="进入订单支付状态检查" />
                </UmlBranch>
                <UmlBranch label="失败">
                  <UmlDecision title="是否需要 3DS？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="否">
                      <UmlAction title="提示错误并中止" note="停留当前流程，不继续 capture" />
                    </UmlBranch>
                    <UmlBranch label="是">
                      <UmlAction title="stripe.handleNextAction" note="唤起 3DS；可能站内返回 result，也可能站外跳转 return_url" />
                      <UmlArrow />
                      <UmlDecision title="3DS 完成位置？" />
                      <Grid columns={2} gap={12}>
                        <UmlBranch label="站内返回 result">
                          <UmlAction title="检查 paymentIntent" note="无 paymentIntent 或 result.error 时提示错误" />
                          <UmlArrow />
                          <UmlAction title="二次 capture" note="成功后再次 capture；失败则不在收银台页时跳收银台" />
                        </UmlBranch>
                        <UmlBranch label="站外跳回 Return">
                          <UmlAction title="跳转 /checkout/return/:id" note="Stripe 使用 return_url 回到 Return.vue" />
                        </UmlBranch>
                      </Grid>
                    </UmlBranch>
                  </Grid>
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="Return.vue 读取参数（仅站外 3DS 验证）" note="orderNumber、orderUUID、payment_intent、payment_intent_client_secret、redirect_status、check_status" />
              <UmlArrow />
              <UmlDecision title="Return 链接类型？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="有 payment_intent">
                  <UmlAction title="Stripe Klarna/Affirm 返回" note="redirect_status=failed 时提示 payment.3ds.failed 并跳收银台" />
                  <UmlArrow />
                  <UmlAction title="否则 capture + check" note="captureOrderStatus 成功后 checkOrderPaymentStatus" />
                </UmlBranch>
                <UmlBranch label="无 payment_intent">
                  <UmlAction title="普通 check_status 轮询" note="check_status=true 时 reCheckOrderStatusUtilDone" />
                  <UmlArrow />
                  <UmlAction title="参数异常回退" note="参数不完整或异常时提示并跳收银台" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="支付状态检查结果？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="非 pending">
                  <UmlStartEnd label="进入成功页" end />
                </UmlBranch>
                <UmlBranch label="pending">
                  <UmlAction title="进入 Return 页轮询" note="每秒一次，最多 30 秒；失败则不在收银台页时跳收银台" />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["环节", "代码位置", "规则"]} rows={stripeRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：PayPal / PayPal Later</H2>
        <Card>
          <CardHeader>PayPal Buttons</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="选择 PayPal / PayPal Later" />
              <UmlArrow />
              <UmlAction title="渲染 PayPal 平台按钮" note="PayPal: fundingSource=PAYPAL；PayPal Later: fundingSource=PAYLATER" />
              <UmlArrow />
              <UmlAction title="PayPal Later 可用性处理" note="渲染失败时 isSupportPayLatter=false；当前选中 paypal_later 且有 paypal_rest 时自动切换" />
              <UmlArrow />
              <UmlDecision title="用户交互入口？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="项目内部 Place Order">
                  <UmlAction title="提示 paypal.load.error" note="说明 PayPal 组件未正常加载或用户未点 PayPal 按钮" />
                  <UmlArrow />
                  <UmlAction title="Checkout 页跳收银台" note="OrderCheckout 页已在收银台，仅提示错误" />
                </UmlBranch>
                <UmlBranch label="PayPal SDK 按钮">
                  <UmlAction title="SDK createOrder" note="paypal_rest / paypal_later 作为 payment_type_code" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="当前是否已有 orderUUID？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="无：Checkout 新下单">
                  <UmlAction title="刷新最新 quote" note="loadQuoteById(quoteId, true)；失败提示并中止" />
                  <UmlArrow />
                  <UmlAction title="placeOrderV2 生成订单" note="失败提示并中止；成功保存 uuid/order_number" />
                  <UmlArrow />
                  <UmlAction title="下单成功后清理" note="affiliate、Buy Now/普通购物车清理、cart coupon/errors 清理、pending order" />
                </UmlBranch>
                <UmlBranch label="有：OrderCheckout 待支付">
                  <UmlAction title="检查邮箱验证锁" note="emailCheckCallback；ORDER_LOCKED 时打开邮箱验证弹窗并中止" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="createPaypalPaymentOrder" note="order_number + payment_type_code + cancel_url + return_url" />
              <UmlArrow />
              <UmlDecision title="PayPal 支付单创建结果？" />
              <Grid columns={3} gap={16}>
                <UmlBranch label="成功">
                  <UmlAction title="返回 trans_id" note="交给 PayPal SDK 继续弹窗授权" />
                </UmlBranch>
                <UmlBranch label="订单取消/已付款">
                  <UmlAction title="提示并中止" note="ORDER_CANCELED / ORDER_PAID；登录去订单详情，匿名去首页" />
                </UmlBranch>
                <UmlBranch label="其他异常">
                  <UmlAction title="EMAIL_VERIFICATION 时触发邮箱验证回调" note="code=EMAIL_VERIFICATION -> emailCheckCallback" />
                  <UmlArrow />
                  <UmlAction title="始终展示接口错误信息" note="FpMessage.warning(data.info)，关闭 pageMask 并中止" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="用户是否 approve？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="approve">
                  <UmlAction title="captureOrderStatus" note="capture code=1 表示捕获成功" />
                  <UmlArrow />
                  <UmlDecision title="capture 是否成功？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="否">
                      <UmlAction title="提示错误" note="Checkout / BuyNow 页跳收银台" />
                    </UmlBranch>
                    <UmlBranch label="是">
                      <UmlAction title="checkOrderPaymentStatus" note="进入订单支付状态检查" />
                    </UmlBranch>
                  </Grid>
                </UmlBranch>
                <UmlBranch label="cancel/error">
                  <UmlAction title="取消或 SDK 错误" note="Checkout / BuyNow 页跳收银台；取消时可先弹确认提示" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="支付状态检查结果？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="非 pending">
                  <UmlStartEnd label="进入成功页" end />
                </UmlBranch>
                <UmlBranch label="pending">
                  <UmlAction title="进入 Return 页轮询" note="不在 return 页则跳 return；return 页最多 30 秒轮询" />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["环节", "代码位置", "规则"]} rows={paypalRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：PayPal 分期信息展示与货币/按钮关系</H2>
        <Card>
          <CardHeader>PayLaterMessage + PayPal Buttons</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="页面拿到 paypalKey" />
              <UmlArrow />
              <UmlDecision title="展示场景？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="Checkout">
                  <UmlAction title="CartPreview 渲染 PayLaterMessage" note="paypalKey + totals.total；placement=payment" />
                  <UmlArrow />
                  <UmlAction title="货币使用默认币种" note="PayLaterMessage 未传 currency 时 getDefaultCurrencyCode" />
                </UmlBranch>
                <UmlBranch label="OrderCheckout">
                  <UmlAction title="OrderPreview 渲染 PayLaterMessage" note="paypalKey + order totals；显式传入 order currency" />
                  <UmlArrow />
                  <UmlAction title="待支付订单页按钮" note="同样使用 PayPal / Pay Later 容器" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="PaypalManager 获取 SDK" note="按 currency-paypalKey 缓存实例；components=buttons,funding-eligibility,messages" />
              <UmlArrow />
              <UmlDecision title="货币是否在支持列表？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="支持">
                  <UmlAction title="向 PayPal SDK 传 currency" note="EUR / GBP / MXN / CAD / AUD / USD / PLN" />
                </UmlBranch>
                <UmlBranch label="不支持或为空">
                  <UmlAction title="不传 currency 参数" note="由 PayPal SDK / 默认配置处理" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <Grid columns={2} gap={16}>
                <UmlBranch label="分期文案">
                  <UmlAction title="paypal.Messages.render" note="buyerCountry、currency、amount、placement 决定展示内容" />
                </UmlBranch>
                <UmlBranch label="支付按钮">
                  <UmlAction title="渲染两个按钮容器" note="paypal-button-container / paypal-latter-button-container" />
                  <UmlArrow />
                  <UmlAction title="按支持状态展示" note="isSupportPaypal / isSupportPayLatter 控制按钮和支付项显示" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="Pay Later 按钮是否渲染成功？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="成功">
                  <UmlAction title="展示 Pay Later" note="quoteStore.isSupportPayLatter=true" />
                </UmlBranch>
                <UmlBranch label="失败">
                  <UmlAction title="隐藏 Pay Later 并降级" note="isSupportPayLatter=false；当前选中 paypal_later 时切到 paypal_rest" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlStartEnd label="分期文案与按钮状态同步" end />
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["场景", "代码位置", "规则"]} rows={paypalInstallmentRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：Adyen</H2>
        <Card>
          <CardHeader>Adyen Components / Redirect</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="初始化 AdyenCheckout" />
              <UmlArrow />
              <UmlAction title="展开子支付方式" note="scheme / applepay / googlepay / afterpay / affirm" />
              <UmlArrow />
              <UmlAction title="选择 adyen-* 子方式" note="保存到 quote 时 code=adyen" />
              <UmlArrow />
              <UmlDecision title="下单入口？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="Checkout 新下单">
                  <UmlAction title="showValidation" note="invalid：停留 Checkout，不刷新 quote、不生成订单" />
                  <UmlArrow />
                  <UmlAction title="刷新 quote 并生成订单" note="成功后记录 order_number / orderUUID，清理购物车和本地邮箱" />
                  <UmlArrow />
                  <UmlAction title="handleAdyenPay" note="Apple Pay：不 submit，直接不在收银台页时跳收银台" />
                </UmlBranch>
                <UmlBranch label="OrderCheckout 待支付订单">
                  <UmlAction title="showValidation" note="invalid：停留 OrderCheckout" />
                  <UmlArrow />
                  <UmlDecision title="是否 adyen-applepay？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="否">
                      <UmlAction title="jumpToEmailVerifyModal" note="ORDER_LOCKED：打开邮箱验证弹窗并中止" />
                    </UmlBranch>
                    <UmlBranch label="是">
                      <UmlAction title="跳过邮箱锁前置检查" note="直接提交当前 Adyen 实例" />
                    </UmlBranch>
                  </Grid>
                  <UmlArrow />
                  <UmlAction title="提交 Adyen 实例" note="selectInstance.submit()" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="onSubmit 创建 Adyen 支付单" note="开启 pageMask；Afterpay type 转 afterpaytouch；传 return_url / payment_method / browser_info / risk_data" />
              <UmlArrow />
              <UmlDecision title="createAdyenPaymentOrder 返回？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="ORDER_CANCELED / ORDER_PAID">
                  <UmlAction title="订单终态提示" note="设置 isPurchaseOrder，展示 warning，关闭 pageMask" />
                  <UmlArrow />
                  <UmlDecision title="登录用户或客户订单？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="是">
                      <UmlAction title="跳订单详情" note="customer-single-order(orderUUID)" />
                    </UmlBranch>
                    <UmlBranch label="否">
                      <UmlAction title="跳首页" note="匿名用户回首页" />
                    </UmlBranch>
                  </Grid>
                </UmlBranch>
                <UmlBranch label="EMAIL_VERIFICATION">
                  <UmlAction title="触发邮箱验证回调" note="emailCheckCallback()" />
                  <UmlArrow />
                  <UmlAction title="组件恢复 ready" note="component.setStatus('ready')，展示接口错误，关闭 pageMask 并中止" />
                </UmlBranch>
              </Grid>
              <Grid columns={2} gap={16}>
                <UmlBranch label="无 result_code / 其他异常">
                  <UmlAction title="拒绝 SDK action" note="actions.reject，component.setStatus('ready')" />
                  <UmlArrow />
                  <UmlAction title="展示错误并中止" note="FpMessage.error(result.info)，关闭 pageMask" />
                </UmlBranch>
                <UmlBranch label="result_code/action 有效">
                  <UmlAction title="actions.resolve" note="把 resultCode/action 交给 Adyen SDK；OrderCheckout redirect 前移除 beforeunload" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="Adyen SDK 后续结果？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="站内 completed">
                  <UmlAction title="captureOrder" note="code!==1：展示错误，Checkout 新下单路径不在收银台页时跳收银台" />
                  <UmlArrow />
                  <UmlAction title="capture 成功" note="设置 isPurchaseOrder，跳 /checkout/adyen/return?orderNumber&orderUUID" />
                </UmlBranch>
                <UmlBranch label="failed / error">
                  <UmlDecision title="支付失败？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="element.type=googlepay">
                      <UmlAction title="直接 return" note="停留在当页，等待用户再次与 Google Pay 交互" />
                    </UmlBranch>
                    <UmlBranch label="其他支付组件">
                      <UmlAction title="继续失败处理" note="如果 data.resultCode=Refused，展示 adyen.payment.failed" />
                    </UmlBranch>
                  </Grid>
                  <UmlArrow />
                  <UmlDecision title="当前是否在收银台页？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="否">
                      <UmlAction title="前往收银台页" note="不在收银台页时跳收银台" />
                    </UmlBranch>
                    <UmlBranch label="是">
                      <UmlAction title="重置组件状态" note="element.setStatus('ready')" />
                    </UmlBranch>
                  </Grid>
                  <UmlArrow />
                  <UmlAction title="中止流程" note="关闭 pageMask" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="Adyen Return 页？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="无 orderUUID/orderNumber">
                  <UmlAction title="跳首页" note="无法识别订单上下文" />
                </UmlBranch>
                <UmlBranch label="带 redirectResult">
                  <UmlAction title="adyenAuthReport 验签" note="code!==1 或 data 为空：提示并跳收银台" />
                  <UmlArrow />
                  <UmlAction title="验签通过后 captureOrder" note="如果数据库查询失败，给出信息提示并前往收银台；除此之外进入轮询状态" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="reCheckOrderStatusUtilDone" note="30 秒内每秒检查；非 pending 跳成功页，code=0 跳收银台，超时强制成功页" />
              <UmlArrow />
              <UmlStartEnd label="成功页 / 订单详情 / 首页 / 收银台回退" end />
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["环节", "代码位置", "规则"]} rows={adyenRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：Ebanx</H2>
        <Card>
          <CardHeader>Ebanx Redirect</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="选择 Ebanx" />
              <UmlArrow />
              <UmlDecision title="扣款入口？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="Checkout 新下单">
                  <UmlAction title="Place Order 成功" note="生成 order_number / orderUUID，清理购物车、coupon/errors、pending order、本地邮箱" />
                </UmlBranch>
                <UmlBranch label="OrderCheckout 待支付订单">
                  <UmlAction title="设置可离开标记" note="isContinueLeave=true，避免离开页面拦截" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="handleEbanxPayment" note="returnOrderId=orderNumber===orderUUID；开启 pageMask" />
              <UmlArrow />
              <UmlAction title="create-ebanx-payment-order" note="return_url 指向 /payment/processing/:returnOrderId" />
              <UmlArrow />
              <UmlDecision title="创建支付单结果？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="code=1 且有 redirect_url">
                  <UmlAction title="跳转第三方支付页" note="window.location.href=redirect_url" />
                  <UmlArrow />
                  <UmlAction title="用户完成或返回" note="第三方带回 payment/processing 页面" />
                </UmlBranch>
                <UmlBranch label="code=1 但无 redirect_url">
                  <UmlAction title="当前实现无显式回退" note="不会进入 catch；页面可能停留 pageMask 状态，属于待补边界" />
                </UmlBranch>
              </Grid>
              <Grid columns={2} gap={16}>
                <UmlBranch label="CANCEL_FAILED">
                  <UmlAction title="展示错误并跳处理页" note="上一笔 Ebanx 支付取消失败，表示用户正在支付或已支付" />
                </UmlBranch>
                <UmlBranch label="ORDER_CANCELED / ORDER_PAID">
                  <UmlAction title="订单终态回退" note="客户订单跳订单详情；否则跳首页" />
                </UmlBranch>
              </Grid>
              <Grid columns={2} gap={16}>
                <UmlBranch label="其他异常">
                  <UmlAction title="关闭 pageMask 并记录 sentry" note="展示 error.message；不在收银台页时跳收银台，已在收银台则停留" />
                </UmlBranch>
                <UmlBranch label="接口抛错">
                  <UmlAction title="同异常处理" note="catch 中统一处理错误码和回退" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="进入 PaymentProcessing？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="参数缺失">
                  <UmlAction title="跳首页" note="无法从路由 id 解析 orderNumber/orderUUID" />
                </UmlBranch>
                <UmlBranch label="参数正常">
                  <UmlAction title="清理 Quote 错误状态" note="resetQuoteCoupon / resetQuoteCartErrors" />
                  <UmlArrow />
                  <UmlAction title="开始轮询" note="首次 captureOrder，后续 checkPaymentStatus" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="处理页检查结果？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="PAYMENT_ORDER_NOT_FOUND">
                  <UmlAction title="跳订单详情" note="customer-single-order(orderUUID)" />
                </UmlBranch>
                <UmlBranch label="pending / 无状态">
                  <UmlAction title="继续等待" note="1 秒后再次检查；接口抛错则 3 秒后重试" />
                </UmlBranch>
              </Grid>
              <Grid columns={2} gap={16}>
                <UmlBranch label="用户点击 Order.Detail">
                  <UmlAction title="离开处理页" note="handleOrderDetails -> customer-single-order(orderUUID)" />
                </UmlBranch>
                <UmlBranch label="有 status 且非 pending">
                  <UmlAction title="跳成功页" note="写 cartStore.orderId，清除 pending order，replace checkout-success" />
                </UmlBranch>
              </Grid>
              <Grid columns={2} gap={16}>
                <UmlBranch label="组件卸载">
                  <UmlAction title="停止定时器" note="onUnmounted stop()" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlStartEnd label="成功页或回退页" end />
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["环节", "代码位置", "规则"]} rows={ebanxRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>异常与回退总览</H2>
        <Table headers={["场景", "代码位置", "处理规则"]} rows={errorRows} striped />
      </Stack>

      <Divider />

      <Stack gap={8}>
        <H2>关键代码入口</H2>
        <Text>
          支付配置与保存位于 <Code>usePaymentProvider</Code>；支付 SDK、扣款、轮询与回退位于 <Code>usePaymentView</Code>；
          支付方式列表和 Billing 协作位于 <Code>VsfPaymentProvider.vue</Code>；下单总入口在 <Code>Checkout.vue</Code>。
        </Text>
      </Stack>
    </Stack>
  );
}
