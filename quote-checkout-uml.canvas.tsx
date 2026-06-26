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

const shippingFindings = [
  [
    "准确",
    "目标模型中，用户访问 checkout 应携带报价单 id，并通过 id 拉取最新 quote 信息。",
    "Checkout.vue 的 `checkoutLoadCurrentQuote(cartId)` 在有 id 时调用 `loadQuoteById(cartId, false)`。",
  ],
  [
    "需标注当前实现差异",
    "当前代码仍保留无 id 的兼容路径，包括普通 quote、buy now、匿名 quoteStore 降级；但后续讨论可以按产品/后端约定忽略虚拟 quote 概念。",
    "Checkout.vue `checkoutLoadCurrentQuote` 对无 id 分支仍调用 `handleBuyNowQuoteForWithoutId` / `handleNormalQuoteForWithoutId`。",
  ],
  [
    "准确",
    "匿名用户填写邮箱会更新 quote 上的 email，并用于弃购邮件抓取。",
    "Shipping.vue `rawHandleEmail` -> `syncAnonymousUserCart` / `attachToCart` / `acartEmailGrab`。",
  ],
  [
    "准确",
    "配送地址保存时登录和匿名最终走不同接口/路径；当前提交前匿名还会确保 cartId 存在并 attach email。",
    "Shipping.vue `handleClickDone`、`handleAddressSubmit`；`useGuestUser.attachToCart`；`useShippingProvider`/shipping save 相关接口。",
  ],
  [
    "需细化",
    "本地 confirmed 不是只看一个字段；当前代码还要求 quote 上有地址、电话区号等，且会重新校验地址完整性。",
    "Shipping.vue `renderInitForGuestOrLoggedWithoutAddress`、`guestUserWithCartAddressInit`、`getAddressIsConfirm`。",
  ],
  [
    "需细化",
    "登录用户新增地址会写入账户地址簿，但可能是 create 或 update；多地址场景会刷新用户地址列表。",
    "Shipping.vue `addOrUpdateAddress`、`createAddress`、`updateAddress`、`useThisAddressForMulAddress`。",
  ],
];

const quoteInitRows = [
  [
    "读取路由 id",
    "Checkout.vue `route.query.id`",
    "目标模型：checkout 页面依赖 URL quote id。",
  ],
  [
    "拉取 quote",
    "useQuote.loadQuoteById",
    "GET `cartV2`，成功后 `quoteStore.updateQuoteData(data.cart, true)`。",
  ],
  [
    "状态校验",
    "Checkout.vue `checkQuoteStatus`",
    "如果 quote inactive，进入订单转换检查；如果 items 为空，返回购物车。",
  ],
  [
    "无 id 兼容",
    "Checkout.vue `checkoutLoadCurrentQuote`",
    "当前代码仍存在兼容分支；后续产品模型按“必须有 id”梳理。",
  ],
];

const buyNowRows = [
  [
    "入口路由",
    "router.options.ts / getQuoteType",
    "`/buyNow/:hash` 复用 `Checkout.vue`，路由名 `buyNow` 会被 `getQuoteType(route.name)` 识别为 `CART_TYPE.buy_now`。",
  ],
  [
    "PDP 前置校验",
    "ConfigurableProduct.vue `buyNow` / `beforeBuyNow`",
    "Buy Now 与普通 PDP 加购共用必选项和库存校验：Simple/Configurable 的自定义选项、可配置属性、库存都通过后才允许继续。",
  ],
  [
    "匿名用户入口",
    "ConfigurableProduct.vue `beforeBuyNow`",
    "匿名点击 Buy Now 时先打开 `AccountActionSidebar`；Continue as Guest、登录、注册成功后都会回到 `handleBuyNow -> buyNow()`。",
  ],
  [
    "匿名首次 Buy Now",
    "useQuote.addItem -> addItemForAnonymousCart",
    "未登录且没有 `buyNowCartId` 时不创建远程 cart，调用 `operateVirtualCart(ADD_ITEM)` 生成本地虚拟 Buy Now quote，并把 items、applied_coupons、shipping_addresses、cart_errors 写入 `cartStore.buyNowCart`。",
  ],
  [
    "登录或已有 Buy Now id",
    "useQuote.addItem -> addItemForRealCart",
    "登录用户或已有 `buyNowCartId` 时，先创建/复用 `createEmptyNowCart` 返回的 Buy Now cart id，再调用 `addSimpleProductsToCartWithType` / `addConfigurableProductsToCartWithType`，`cart_type=buy_now`。",
  ],
  [
    "跳转 Buy Now Checkout",
    "ConfigurableProduct.vue `buyNow`",
    "加购成功后根据 quote items 生成 security key，跳转 `/buyNow/:hash`，并携带 `id=apiState.getBuyNowCartId()`；匿名首次本地虚拟 Buy Now 可能还没有远程 id。",
  ],
  [
    "Checkout 初始化",
    "Checkout.vue `checkoutLoadCurrentQuote`",
    "有 id 时和普通 quote 一样调用 `loadQuoteById(id, false)`；无 id 且 `quoteType=buy_now` 时，从持久化 `cartStore.buyNowCart` 恢复 items、coupon、shipping_addresses、cart_errors。",
  ],
  [
    "匿名同步远程 quote",
    "Shipping.vue `syncAnonymousUserCart` / useQuote.syncAnonymousQuote",
    "匿名 Buy Now 在提交邮箱/地址前调用 `syncAnonymousQuote({ type: CART_TYPE.buy_now })`；接口返回 cart id 后写回 URL，并通过 `apiState.setBuyNowCartId(cartId)` 保存 Buy Now cart id。",
  ],
  [
    "虚拟 Buy Now 配送刷新",
    "Shipping.vue `virtualCartInitShippingMethods` / useQuote.loadVirtualQuote",
    "匿名本地 Buy Now quote 通过 `loadVirtualQuote` 重新计算配送、价格、优惠券和错误；若出现 coupon 错误，会清空 `buyNowCart.applied_coupons`。",
  ],
  [
    "优惠券持久化",
    "CheckoutCouponCode watch(applied_coupons)",
    "Buy Now 页面 quote 的 applied_coupons 变化时，会同步写回 `cartStore.buyNowCart.applied_coupons`，保证无 id 恢复路径可拿到最新优惠券状态。",
  ],
  [
    "下单后清理",
    "Checkout.vue `placeOrder`",
    "`quoteType=buy_now` 下单成功后只移除 `buyNowCartId` 并清空 `buyNowCartData`；不会刷新或清空普通购物车，也不会执行普通购物车 coupon error 清理分支。",
  ],
];

const shippingInitRows = [
  [
    "匿名 + quote 有地址",
    "guestUserWithCartAddressInit",
    "从 quote.shipping_addresses 初始化表单；根据本地 confirmed 和地址完整性决定 done / 展开。",
  ],
  [
    "匿名 + quote 无地址",
    "loggedWithoutAnyAddressAndGuestUserInit",
    "用默认国家初始化表单并加载可用配送方式，地址表单展开。",
  ],
  [
    "登录 + quote 有地址 + 本地地址 id 有效",
    "loggedWithCartAddressInit",
    "从 quote 地址初始化并根据本地 confirmed 决定 done；加载真实 quote 的配送方式。",
  ],
  [
    "登录 + 有全局地址",
    "loggedWithGlobalAddressInit",
    "使用 global address 设置到 quote，初始化配送方式，直接 done。",
  ],
  [
    "登录 + 有地址簿但无全局地址",
    "loggedWithAddressInit",
    "使用默认地址或第一个可用地址作为当前勾选地址，地址列表展开，非 done。",
  ],
  [
    "登录 + 地址簿为空",
    "loggedWithoutAnyAddressAndGuestUserInit",
    "初始化默认国家，地址表单展开；后续提交时会创建账户地址。",
  ],
];

const emailRows = [
  [
    "输入邮箱",
    "AddressForm `@updateEmail`",
    "匿名用户邮箱必填；登录用户不需要展示/输入邮箱。",
  ],
  [
    "确保 quote id",
    "Shipping.vue `syncAnonymousUserCart`",
    "当前代码无 id 时会同步匿名 quote 并把返回 id 写回 URL；Buy Now 匿名本地 quote 会以 `cart_type=buy_now` 同步，并额外保存 `buyNowCartId`。",
  ],
  [
    "更新 quote email",
    "useGuestUser.attachToCart",
    "调用 attachToCart 后更新 `quote.email`、coupons、cart_errors。",
  ],
  [
    "弃购邮件",
    "useAcartEmailGrab",
    "`acartEmailGrab({ email, cartId })` 使用同一邮箱继续弃购邮件链路。",
  ],
];

const shippingSubmitRows = [
  [
    "匿名：确保 quote id",
    "Shipping.vue `handleClickDone`",
    "`await syncAnonymousUserCart({ email })`；仅当前 URL 没有 cartId 时执行，返回 id 后 `router.replace` 写入 URL。Buy Now 会按 `CART_TYPE.buy_now` 同步并保存 `buyNowCartId`。",
  ],
  [
    "匿名：更新 quote 邮箱",
    "useGuestUser.attachToCart",
    "`await attachToCart({ email, cart_id })`；接口为 `setGuestEmailOnCartV2`，成功后更新 `quote.email`、coupons、cart_errors。",
  ],
  [
    "登录：跳过邮箱接口",
    "Shipping.vue `handleClickDone`",
    "登录用户不执行 `syncAnonymousQuote` / `attachToCart`，直接进入地址提交。",
  ],
  [
    "保存 billing",
    "useBilling.save",
    "`await saveBilling(...)`；接口为 `setBillingAddressOnCartV2`，可通过 `sameAsShipping` 让后端同时覆盖 quote 上的 billing/shipping 相关数据。",
  ],
  [
    "保存 shipping",
    "useShipping.save",
    "`await saveShipping(...)`；接口为 `setShippingAddressesOnCartV2`，更新 shipping_addresses、prices、items、coupons、tax/exemption、cart_errors。",
  ],
  [
    "登录多地址顺序",
    "Shipping.vue `handleAddressSubmit`",
    "当登录且有地址簿，并需要同步 billing 时，代码明确先 `await saveBilling`，再 `await saveShipping`，注释说明必须有先后顺序。",
  ],
  [
    "匿名常见分支",
    "Shipping.vue `handleAddressSubmit`",
    "匿名用户没有地址簿，默认 `sameAsShipping=true`；保存邮寄地址时通常只 `await saveBilling`，由 billing 接口同步覆盖 quote 上的地址信息。",
  ],
  [
    "仅 shipping 分支",
    "Shipping.vue `handleAddressSubmit`",
    "当 quote 已有 billing、`shippingSameAsBilling=false` 且 billing 国家与 shipping 国家一致时，只 `await saveShipping`，表示保留独立账单地址。",
  ],
  [
    "国家不一致回滚",
    "Shipping.vue `handleAddressSubmit`",
    "`!isEqualsCountry && !shippingSameAsBilling` 时强制 `setSameAsShippingStatus(true)`，再走 billing 保存分支，避免账单/邮寄国家不一致。",
  ],
  [
    "登录账户地址簿",
    "Shipping.vue `addOrUpdateAddress`",
    "地址保存到 quote 后，若表单为新增/编辑地址，会异步 create/update 用户账户地址；无地址用户提交后会 `await addOrUpdateAddress`。",
  ],
  [
    "支付方式刷新",
    "Shipping.vue -> Checkout.vue `initPayment`",
    "`handleClickDone` 记录 oldCountryCode/newCountryCode；step 完成后 emit `initPayment`。父组件只在首次或国家变化时重新拉取/渲染支付方式。",
  ],
  [
    "完成后触发",
    "Shipping.vue `handleClickDone`",
    "`await handleAddressSubmit()` 完成后同步 confirmed；若 step completed，滚动到 shipping method 并 `emit('initPayment', oldCountryCode, newCountryCode)`。",
  ],
];

const shippingBillingRows = [
  [
    "地址类型",
    "Shipping Address",
    "第一步表单填写的是邮寄地址；该地址会影响 quote 总金额、可用配送方式、税费/优惠和后续支付方式可用性。",
  ],
  [
    "地址类型",
    "Billing Address",
    "账单地址默认跟随邮寄地址；当支付卡片里取消 same as shipping 时，允许账单地址和邮寄地址不同。",
  ],
  [
    "状态开关",
    "quoteStore.shippingSameAsBilling",
    "默认 true；`Billing.vue` 取消跟随时置 false；某些支付方式不需要 billing 时 `VsfPaymentProvider` 会恢复 true 并更新 billing。",
  ],
  [
    "保存条件",
    "需要保存 billing",
    "当 quote 没有 billing、`shippingSameAsBilling=true`、或 billing 国家与新的 shipping 国家不一致时，进入 billing 保存分支。",
  ],
  [
    "保存条件",
    "只保存 shipping",
    "当用户明确希望 shipping/billing 不同，且 billing 国家与 shipping 国家一致时，只保存 shipping address。",
  ],
];

const shippingEdgeRows = [
  [
    "Change / Edit",
    "backToShippingDetailsStep / handleEditAddressBtnClick",
    "把 shipping step 标记为未完成；登录多地址显示地址列表，匿名或无地址用户显示表单；同步 localStorage confirmed=false。",
  ],
  [
    "Add New Address",
    "handleAddNewAddressBtnClick",
    "暂存旧地址，currentAddressId/createAddressId 置为 -1，表单重置为 store 默认国家，step 未完成。",
  ],
  [
    "Cancel",
    "cancelAddNewAddress",
    "有地址簿时恢复旧地址并回到地址列表；无地址簿/匿名时恢复 quote 上地址，并按地址是否存在恢复 done 状态。",
  ],
  [
    "MX CURP/RFC 缺失",
    "ensureMxCurpAddressFormIfNeeded",
    "检测到墨西哥历史地址缺 CURP/RFC 时，强制展开编辑表单并触发字段校验，阻止继续 Done。",
  ],
  [
    "未选择地址",
    "loggedUserClickDoneButton",
    "登录地址列表模式下 currentAddressId 为空会提示 `error.select.address`，不提交接口。",
  ],
  [
    "无可用配送方式",
    "updateShippingMethods",
    "shippingMethods 为空时把 step completed 置为 false，并滚动到 no-shipping-tip。",
  ],
  [
    "confirmed 严格校验",
    "isValidInfoInLocal / getAddressIsConfirm",
    "不仅看 localStorage is_confirm，还检查匿名邮箱、姓名、电话、街道、邮编、国家/region 等必填字段。",
  ],
  [
    "地址可用国家过滤",
    "addresses computed",
    "登录用户地址簿会过滤掉当前 countries 列表不支持的国家地址。",
  ],
  [
    "默认国家优先级",
    "getUserDefaultCountryCode",
    "优先 quote 地址国家，其次全局国家，最后 store 默认国家。",
  ],
  [
    "初始化配送方式",
    "realCartInitShippingMethods / cartWithoutAddressInitShippingMethods",
    "无完整地址时调用 setShippingCountryCode；有完整地址且 confirmed 时可能 handleAddressSubmit 重算；未 confirmed 时仅使用 quote 上现有 methods。",
  ],
];

const postShippingRows = [
  [
    "地址提交成功",
    "Shipping.vue `handleClickDone`",
    "`handleAddressSubmit` 保存地址后读取 quote 返回值；默认不调用 `setShippingMethodsOnCart`。",
  ],
  [
    "默认配送方式",
    "后端 quote 响应",
    "保存地址接口返回 `available_shipping_methods` 与 `selected_shipping_method`；当前报价单默认配送方式来自响应。",
  ],
  [
    "无配送方式",
    "Shipping.vue `updateShippingMethods`",
    "`available_shipping_methods` 为空时显示 `shipping.no.available`，并把 Shipping Step 置为未完成。",
  ],
  [
    "模块解锁",
    "VsfPaymentProvider / ItemsInCart",
    "支付方式与商品条目都有遮罩条件：地址无效或 Shipping Step 未完成时不可操作。",
  ],
  [
    "支付方式加载",
    "Checkout.vue `initPayment`",
    "Shipping 完成后触发；首次或国家变化时调用 payment-service 获取可用支付方式。",
  ],
  [
    "选择支付方式",
    "VsfPaymentProvider `switchPaymentMethod`",
    "调用 `setPaymentMethodOnCart` 保存到 quote；若支付方式不需要 billing，会把 `shippingSameAsBilling` 恢复为 true 并保存 billing。",
  ],
  [
    "商品数量更新",
    "ItemsInCart -> useQuote.updateItemQty",
    "调用 `updateCartItemsV2`，更新 quote items、prices、shipping_addresses、applied_coupons、cart_errors，并刷新配送方式列表；Buy Now 进入远程 quote 后也走这条 quote 更新路径。",
  ],
  [
    "移除商品",
    "ItemsInCart -> useQuote.removeItem",
    "仅 quote 条目大于 1 时展示移除按钮；调用 `removeItemFromCartV2`，移除后若 items 为空返回购物车页。Buy Now 通常单商品，移除按钮大多不会展示。",
  ],
  [
    "手动切换配送方式",
    "ItemsInCart / VsfShippingProvider",
    "当存在多个 shipping method 时可切换；这时才调用 `setShippingMethodsOnCart`。",
  ],
];

const quoteAdjustmentRows = [
  [
    "优惠券",
    "CheckoutCouponCode",
    "允许 apply/remove；真实 quote 走 `applyCouponToCartV2` / `removeCouponFromCartV2`，更新 prices、items、shipping、applied_coupons、cart_errors。",
  ],
  [
    "Pro 折扣",
    "CartPreview / ItemsInCart",
    "Pro 用户 summary 展示 pro savings；`prices.used_pro_discount=false` 且已用优惠券时，优惠券输入框提示 `pro.exclude.coupon`。",
  ],
  [
    "积分",
    "RewardPoint / PointInput",
    "仅 Points 会员展示；调用 `applyPointRedeemToCart` / `removePointFromCart`，更新 prices、shipping、applied_coupons、cart_errors。",
  ],
  [
    "积分与优惠券互斥",
    "useQuote.handleRewardPoint",
    "互斥结果主要由接口响应体现：应用积分后 quote 可能更新或清空 `applied_coupons`，失败则通过 `applyRewardMsg` 展示错误。",
  ],
  [
    "免税证",
    "TaxExemptInput",
    "仅登录用户、default store、quote 有税或已减税时展示；调用 `applyExemptionToQuote` / `removeExemptionFromQuote`。",
  ],
  [
    "免税证影响",
    "useQuote.applyExemptionToQuote",
    "更新 prices、applied_exemption、applied_coupons、cart_errors；不直接重算配送方式。",
  ],
  [
    "支付/下单按钮",
    "CartPreview",
    "下单按钮要求地址有效、Shipping Step 完成、有 selected shipping method、有 selected payment method，且支付组件不在 loading。",
  ],
];

const billingPaymentRows = [
  [
    "触发条件",
    "VsfPaymentProvider",
    "只有当前支付方式 `require_billing=true` 且 shipping 地址有效时，才展示 BillingStep；Stripe / Adyen cards 是典型场景。",
  ],
  [
    "允许不一致",
    "Billing.vue",
    "用户取消 `same as shipping` 后，`quoteStore.shippingSameAsBilling=false`，billing address 可以与 shipping address 不同。",
  ],
  [
    "填写独立账单地址",
    "Billing.vue `handleAddressSubmit`",
    "展开 AddressForm，点击 Use this address 后调用 `saveBilling`，参数 `sameAsShipping=false`。",
  ],
  [
    "不写地址簿",
    "Billing.vue `handleAddressSubmit`",
    "独立 billing 保存时 `customerAddressId=null`、`save_in_address_book=false`；匿名和登录用户都只更新 quote，不补写账户地址簿。",
  ],
  [
    "取消编辑",
    "Billing.vue `cancelEdit`",
    "恢复 `oldBillingDetails`，关闭编辑表单，回到上一次账单地址展示状态。",
  ],
  [
    "重新跟随 shipping",
    "Billing.vue `changeFollowShippingAddress`",
    "勾选 same as shipping 时，把 shipping 地址格式化成 billing，调用 `saveBilling`，参数 `sameAsShipping=true`。",
  ],
  [
    "切换到无需 billing 的支付方式",
    "VsfPaymentProvider `switchPaymentMethod`",
    "如果当前是独立 billing，切换到 `require_billing=false` 的方式会先把 `shippingSameAsBilling=true`，再用 shipping 地址保存 billing。",
  ],
  [
    "支付方式保存",
    "VsfPaymentProvider `definePaymentMethods`",
    "billing 同步完成后调用 `setPaymentMethodOnCart`；Adyen 子方式会转换为 code=`adyen` 并带 `adyen.payment_method`。",
  ],
];

const placeOrderRows = [
  [
    "按钮可点条件",
    "CartPreview `placeOrderDisabled`",
    "要求 shipping 地址有效、已选配送方式、Shipping Step 完成、已选支付方式，且支付组件不在 loading。",
  ],
  [
    "Stripe 前置校验",
    "Checkout.vue `placeOrder`",
    "若选中 Stripe，先执行 `stripeCheckBeforePlaceOrder`；卡片字段无效时提示并中止，不重新拉 quote。",
  ],
  [
    "Adyen 前置校验",
    "Checkout.vue `placeOrder`",
    "若选中 Adyen 子支付，先 `showValidation()`；组件无效时中止，不重新拉 quote。",
  ],
  [
    "前置校验失败",
    "Checkout.vue `placeOrder`",
    "Stripe 或 Adyen 前置校验失败时直接 return，流程中断，不执行 `loadQuoteById`、`placeOrderV2` 或扣款逻辑。",
  ],
  [
    "强制刷新 quote",
    "Checkout.vue `placeOrder`",
    "前置校验通过后 `await loadQuoteById(quoteId, true)`，以最新 quote 更新页面状态；`true` 表示保留当前 shipping method。",
  ],
  [
    "刷新 quote 失败",
    "Checkout.vue `placeOrder`",
    "若 `loadQuoteById` 有错误，非授权失效错误会提示 message，关闭 pageMask 并停留当前页。",
  ],
  [
    "生成订单",
    "useMakeOrder.make",
    "调用 `placeOrderV2`，参数包括 `cart_id` 与 `purchase_order_number`。",
  ],
  [
    "下单接口异常",
    "Checkout.vue `placeOrder`",
    "如果 `make` 有错误或没有返回订单，提示错误 message，关闭 pageMask，并停留当前页面供用户继续交互。",
  ],
  [
    "保存订单基础信息",
    "Checkout.vue `placeOrder`",
    "下单成功后保存 `order_number` / `uuid`，并触发 `recordAffiliateData()`。",
  ],
  [
    "Buy Now 购物车清理",
    "Checkout.vue `placeOrder`",
    "`quoteType === CART_TYPE.buy_now` 时移除 Buy Now cart id，并清理 `buyNowCart` 本地数据；不刷新/清空普通购物车。",
  ],
  [
    "普通 Quote 购物车刷新/清空",
    "Checkout.vue `placeOrder`",
    "`quoteType === CART_TYPE.quote` 时，登录用户 `loadCart()` 刷新购物车，匿名用户 `clearAnonymousShoppingCart(orderNumber)` 清空匿名购物车。",
  ],
  [
    "清除购物车优惠券相关数据",
    "Checkout.vue `placeOrder`",
    "普通 quote 清理购物车后执行 `cartStore.resetCartCoupon()` 与 `cartStore.resetCartErrors()`，避免下次加购后继续展示旧优惠券错误。",
  ],
  [
    "写入 Pending Order",
    "Checkout.vue `placeOrder`",
    "确认 `orderNumber` / `orderUUID` 存在后，调用 `orderStore.setPendingOrder(orderUUID, anon_order_token, isLogin)`。",
  ],
  [
    "清除 checkout 本地邮箱数据",
    "Checkout.vue `placeOrder`",
    "进入扣款/跳转前执行 `removeLocalStorageItem('checkout')`，清理 checkout 阶段持久化邮箱数据。",
  ],
];

const paymentDeductionRows = [
  [
    "Bank Transfer",
    "Checkout.vue `placeOrder`",
    "订单生成后直接跳转 `paymentOffline`，不走在线扣款。",
  ],
  [
    "Adyen",
    "Checkout.vue `handleAdyenPay`",
    "订单生成后提交 Adyen 组件；Apple Pay 直接进入收银台页，提交异常也提示并跳收银台。",
  ],
  [
    "Stripe",
    "usePaymentView `stripeDeductingMoney`",
    "确认 Stripe 支付信息，创建支付单、捕获状态；需要 3DS 时执行 next action；异常则提示并跳收银台页。",
  ],
  [
    "PayPal",
    "Checkout.vue `startDeductingMoney`",
    "若 PayPal 组件未正常加载，提示后跳转到收银台页继续处理。",
  ],
  [
    "Ebanx",
    "usePaymentView `handleEbanxPayment`",
    "创建 Ebanx 支付单，成功拿到 redirect_url 后跳转；异常时按错误码提示、跳处理页或收银台页。",
  ],
];

const checkoutLoginAndSyncRows = [
  [
    "结账页登录入口",
    "Checkout.vue template",
    "Checkout 主页面没有挂载 `AccountActionSidebar` / `AccountActionPopup`，也没有展示独立登录入口；登录、注册、Continue as Guest 的分流发生在购物车页 Secure Checkout 阶段。",
  ],
  [
    "Shipping 事件保留但未接入",
    "Shipping.vue emits / Checkout.vue `ShippingStep`",
    "`Shipping.vue` 声明了 `user-login` 事件，但当前文件内没有实际 emit；父级 `Checkout.vue` 也没有监听 `@user-login`。",
  ],
  [
    "登录失效处理",
    "Checkout.vue watch(isLogin) / useQuote 等 composable",
    "如果 checkout 中登录态从登录变为未登录，或 quote 接口返回 `CART_AUTHORIZATION_FAILED`，页面提示 `quote.login.expired` 并跳转 `/cart`，而不是在 checkout 内打开登录。",
  ],
  [
    "首次进入或 BFCache 恢复",
    "Checkout.vue `checkCartStatus` / `useBFCListener`",
    "首次进入页面会执行 `checkQuoteStatus -> checkoutLoadCurrentQuote -> loadQuoteById` 拉取最新 quote；浏览器 BFCache 恢复时也会重新执行 `checkCartStatus`。",
  ],
  [
    "多窗口重新可见",
    "Checkout.vue `handlePageShow`",
    "窗口从后台回到前台时监听 `visibilitychange`，当前实现调用 `quoteIsAvailable(quoteId)` 校验 quote 是否仍可用；不可用则提示 `cart.expired` 并跳首页。",
  ],
  [
    "多窗口数据刷新边界",
    "Checkout.vue `handlePageShow` / `placeOrder`",
    "可见性恢复时不是完整 `loadQuoteById` 刷新展示；完整刷新主要发生在首次进入、BFCache 恢复和 Place Order 前的 `loadQuoteById(quoteId, true)`。",
  ],
];

const quoteExceptionRows = [
  [
    "登录失效",
    "useQuote / useShipping / useBilling / usePaymentProvider / useMakeOrder",
    "`CART_AUTHORIZATION_FAILED` 时提示 `quote.login.expired`，跳转 `/cart`，当前 quote 操作中断；报价单阶段通常不回退匿名逻辑。",
  ],
  [
    "Quote 不存在或不属于当前站点",
    "useQuote / useShipping / useBilling / usePaymentProvider / useMakeOrder",
    "`CART_NOT_FOUND` 时提示后跳转 `/cart`，避免继续在无效 quote 上保存地址、支付方式或下单。",
  ],
  [
    "Quote 已失活",
    "Checkout.vue `checkQuoteStatus`",
    "`loadQuoteById` 返回 `CART_NOT_ACTIVE` 后调用 `whetherCartConvertedIntoOrder`；若已转订单，按订单状态跳转，否则提示 `cart.expired` 并跳首页。",
  ],
  [
    "Quote 商品为空",
    "Checkout.vue `checkQuoteStatus`",
    "`products.length === 0` 时跳转 `/cart`，不进入核心 checkout 组件。",
  ],
  [
    "页面恢复/多标签场景",
    "Checkout.vue `handlePageShow`",
    "页面重新可见时调用 `quoteIsAvailable`；quote 不可用则提示 `cart.expired` 并跳首页。",
  ],
  [
    "登录态变化",
    "Checkout.vue watch(isLogin)",
    "登录用户变为未登录时清理 Stripe Elements，提示 `quote.login.expired`，跳转 `/cart`。",
  ],
  [
    "地址保存异常",
    "useShipping.save / useBilling.save",
    "保存 shipping/billing 时遇到授权失效或 cart not found 都跳 `/cart`；其他异常提示 message 并记录错误。",
  ],
  [
    "配送方式保存异常",
    "useShippingProvider.save",
    "手动切换 shipping method 时遇到授权失效或 cart not found 跳 `/cart`；其他异常提示并抛出。",
  ],
  [
    "支付方式保存异常",
    "usePaymentProvider.save",
    "保存 payment method 时遇到授权失效或 cart not found 跳 `/cart`；其他异常提示并记录 save error。",
  ],
  [
    "商品数量/移除异常",
    "useQuote.updateItemQty / removeItem",
    "授权失效或 cart not found 跳 `/cart`；cart not active 会 clear quote；数量更新失败时商品输入框会 reset。",
  ],
  [
    "金额调整异常",
    "useQuote.applyCoupon/applyPoint/applyExemption",
    "优惠券、积分、免税证遇到授权失效或 cart not found 跳 `/cart`；cart not active 部分分支会 clear quote。",
  ],
  [
    "下单异常",
    "Checkout.vue `placeOrder` / useMakeOrder.make",
    "下单前刷新 quote 或 placeOrderV2 遇到登录失效/quote not found 会跳 `/cart`；普通接口错误则提示并停留当前页。",
  ],
];

const optimizationRows = [
  [
    "报价单地址设置逻辑优化",
    "Shipping / Billing Address",
    "当前 shipping、billing、sameAsShipping、登录地址簿、匿名邮箱同步和国家变化分支交织较多；期望后续收敛地址设置职责，减少前端分支和重复状态同步。",
  ],
  [
    "报价单错误信息字段优化",
    "Quote errors / cart_errors",
    "当前错误信息分散在 quote 接口错误、cart_errors、商品行 issue_message、coupon/point/exemption 响应等多个字段；期望统一错误字段结构，便于页面展示、拦截和恢复。",
  ],
];

function UmlStartEnd({ label, end = false }: { label: string; end?: boolean }) {
  const theme = useHostTheme();
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          minWidth: 96,
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
        <div
          style={{
            transform: "rotate(-45deg)",
            width: 94,
            textAlign: "center",
            fontSize: 12,
            fontWeight: 600,
            color: theme.text.primary,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

function UmlArrow({ label }: { label?: string }) {
  const theme = useHostTheme();
  return (
    <div style={{ textAlign: "center", color: theme.text.tertiary, lineHeight: "22px" }}>
      <div style={{ fontSize: 16 }}>↓</div>
      {label ? <div style={{ fontSize: 12 }}>{label}</div> : null}
    </div>
  );
}

function UmlBranch({ label, children }: { label: string; children: any }) {
  return (
    <Card variant="borderless">
      <CardBody style={{ padding: 0 }}>
        <Row gap={8} align="center" style={{ marginBottom: 8 }}>
          <Pill tone="info" active size="sm">
            {label}
          </Pill>
        </Row>
        <Stack gap={8}>{children}</Stack>
      </CardBody>
    </Card>
  );
}

export default function QuoteCheckoutUmlCanvas() {
  return (
    <Stack gap={22} style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
      <Stack gap={8}>
        <H1>报价单 / 结账流程 UML</H1>
        <Text tone="secondary">
          覆盖 Checkout Quote 初始化、Buy Now 加购与结账特殊处理、匿名邮箱、Shipping Address、Billing Address、地址提交后的结账操作、下单扣款入口、登录入口与多窗口同步、Quote 异常与失效回退，以及可优化点。
        </Text>
      </Stack>

      <Card>
        <CardHeader>范围边界</CardHeader>
        <CardBody>
          <Text>
            本 Canvas 从购物车点击 checkout 或 PDP 点击 Buy Now 之后开始，聚焦 <Code>quote</Code>、checkout 页面初始化、地址、配送、优惠券、税、积分、支付和下单。购物车页本身的 add/update/remove/coupon/select all 逻辑已在 <Code>cart-uml.canvas.tsx</Code> 中收束。后续业务讨论按“checkout URL 携带 quote id”作为目标模型；当前代码仍保留无 id 兼容路径，相关差异会单独标注。
          </Text>
        </CardBody>
      </Card>

      <Stack gap={10}>
        <H2>本轮描述校验结论</H2>
        <Table headers={["结论", "说明", "代码证据"]} rows={shippingFindings} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：Checkout Quote 初始化</H2>
        <Card>
          <CardHeader>URL quote id 驱动</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="访问 checkout" />
              <UmlArrow />
              <UmlDecision title="URL 是否有 quote id？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="有 id：目标模型">
                  <UmlAction title="loadQuoteById" note="调用 cartV2 拉取 quote" />
                  <UmlArrow />
                  <UmlAction title="写入 quoteStore" note="items / prices / addresses / coupons / errors" />
                  <UmlArrow />
                  <UmlDecision title="quote 是否有效？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="有效">
                      <UmlStartEnd label="渲染 checkout" end />
                    </UmlBranch>
                    <UmlBranch label="无商品/失活">
                      <UmlAction title="返回购物车或检查订单状态" note="items 为空回 cart；inactive 检查是否已转订单" />
                    </UmlBranch>
                  </Grid>
                </UmlBranch>
                <UmlBranch label="无 id：当前兼容">
                  <UmlAction title="兼容旧路径" note="当前代码仍处理 buy now / session quote / 匿名降级" />
                  <UmlArrow />
                  <UmlStartEnd label="后续模型不主讲" end />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["环节", "代码位置", "规则"]} rows={quoteInitRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：Buy Now 加购与结账特殊处理</H2>
        <Card>
          <CardHeader>PDP Buy Now → Buy Now Checkout</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="PDP 点击 Buy Now" />
              <UmlArrow />
              <UmlAction title="校验选项与库存" note="Simple / Configurable 的自定义选项、可配置属性、库存均通过才继续" />
              <UmlArrow />
              <UmlDecision title="是否登录？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="匿名">
                  <UmlAction title="打开 AccountActionSidebar" note="Continue as Guest / Login / Register 后回到 handleBuyNow" />
                  <UmlArrow />
                  <UmlDecision title="是否已有 buyNowCartId？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="无">
                      <UmlAction title="本地虚拟 Buy Now quote" note="operateVirtualCart(ADD_ITEM)，写入 quoteStore 与 cartStore.buyNowCart" />
                    </UmlBranch>
                    <UmlBranch label="有">
                      <UmlAction title="远程 Buy Now cart" note="复用 buyNowCartId，cart_type=buy_now 加购" />
                    </UmlBranch>
                  </Grid>
                </UmlBranch>
                <UmlBranch label="登录">
                  <UmlAction title="创建/复用 Buy Now cart" note="createEmptyNowCart -> apiState.setBuyNowCartId" />
                  <UmlArrow />
                  <UmlAction title="按商品类型加购" note="addSimpleProductsToCartWithType / addConfigurableProductsToCartWithType，cart_type=buy_now" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="生成 Buy Now 跳转链接" note="getSecurityKeyForCartItems；跳 /buyNow/:hash，可携带 id=buyNowCartId" />
              <UmlArrow />
              <UmlDecision title="Checkout URL 是否有 id？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="有 id">
                  <UmlAction title="loadQuoteById" note="和普通 quote 一样拉取远程 Buy Now quote" />
                </UmlBranch>
                <UmlBranch label="无 id：匿名本地兼容">
                  <UmlAction title="恢复 buyNowCart" note="从 cartStore.buyNowCart 读取 items / coupons / shipping_addresses / cart_errors" />
                  <UmlArrow />
                  <UmlAction title="提交邮箱/地址时同步" note="syncAnonymousQuote(type=buy_now)，返回 id 后写回 URL 并保存 buyNowCartId" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="Buy Now Checkout 操作" note="地址、支付、数量更新、优惠券等进入 quote 流程；coupon 变化会同步 buyNowCart.applied_coupons" />
              <UmlArrow />
              <UmlAction title="Place Order 成功清理" note="只移除 buyNowCartId 并清空 buyNowCartData，不刷新/清空普通购物车" />
              <UmlArrow />
              <UmlStartEnd label="进入扣款或支付页" end />
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["环节", "代码位置", "Buy Now 规则"]} rows={buyNowRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：匿名邮箱与弃购邮件</H2>
        <Card>
          <CardHeader>Guest Email Sync</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="匿名填写邮箱" />
              <UmlArrow />
              <UmlDecision title="URL 是否已有 quote id？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="有 id">
                  <UmlAction title="attachToCart" note="把 email 写入 quote" />
                </UmlBranch>
                <UmlBranch label="无 id：当前兼容">
                  <UmlAction title="syncAnonymousQuote" note="先同步并把 quote id 写回 URL" />
                  <UmlArrow />
                  <UmlAction title="attachToCart" note="再写入 email" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="acartEmailGrab" note="使用相同 email + cartId 继续弃购邮件链路" />
              <UmlArrow />
              <UmlStartEnd label="邮箱同步完成" end />
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["环节", "代码位置", "规则"]} rows={emailRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：Shipping Address 初始化</H2>
        <Card>
          <CardHeader>地址展示状态决策</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="Shipping Step mounted" />
              <UmlArrow />
              <UmlAction title="读取 quote、国家、用户地址" note="quote.shipping_addresses + loadUserShipping + loadCountries" />
              <UmlArrow />
              <UmlDecision title="是否登录？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="匿名用户">
                  <UmlAction title="检查 quote 地址" note="quote.shipping_addresses 是否存在" />
                  <UmlArrow />
                  <UmlAction title="有地址：恢复 quote 地址" note="结合 localStorage confirmed 与地址完整性决定 done / 展开" />
                  <UmlArrow label="无地址" />
                  <UmlAction title="初始化默认国家" note="地址表单展开，等待用户编辑" />
                </UmlBranch>
                <UmlBranch label="登录用户">
                  <UmlAction title="优先恢复 quote 地址" note="quote 地址完整且本地 confirmed 时显示 done" />
                  <UmlArrow label="否则" />
                  <UmlAction title="尝试使用 global address" note="有 global address 时设置到 quote，并直接 done" />
                  <UmlArrow label="否则" />
                  <UmlAction title="使用地址簿默认/第一个地址" note="过滤不可用国家地址；地址列表展开，非 done" />
                  <UmlArrow label="地址簿为空" />
                  <UmlAction title="初始化默认国家" note="表单展开；后续提交时创建账户地址" />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["场景", "代码位置", "初始化规则"]} rows={shippingInitRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：Shipping Address 提交</H2>
        <Card>
          <CardHeader>Done Button</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="点击 Done" />
              <UmlArrow />
              <UmlDecision title="是否匿名？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="匿名">
                  <UmlAction title="确保 quote id" note="无 id 时 await syncAnonymousQuote，并写回 URL" />
                  <UmlArrow />
                  <UmlAction title="更新 quote email" note="await attachToCart -> setGuestEmailOnCartV2" />
                </UmlBranch>
                <UmlBranch label="登录">
                  <UmlAction title="跳过邮箱同步" note="不调用 syncAnonymousQuote / attachToCart" />
                  <UmlArrow />
                  <UmlAction title="使用账户地址上下文" note="可能引用 customerAddressId 或提交新地址数据" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="需要同步 billing？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="是">
                  <UmlAction title="await saveBilling" note="setBillingAddressOnCartV2；sameAsShipping 可覆盖 shipping" />
                  <UmlArrow />
                  <UmlAction title="可能继续 await saveShipping" note="登录多地址场景必须先 billing 后 shipping" />
                </UmlBranch>
                <UmlBranch label="否">
                  <UmlAction title="await saveShipping" note="保留独立 billing，仅更新邮寄地址" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="shipping 国家是否变化？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="变化">
                  <UmlAction title="重新初始化支付方式" note="emit initPayment(oldCountry, newCountry)，父组件重新 load payment methods" />
                </UmlBranch>
                <UmlBranch label="未变化">
                  <UmlAction title="不重复拉取支付方式" note="仍更新 shipping methods/summary，但支付方式不重新渲染" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="登录地址簿补写" note="新增/编辑地址时 create/update 账户地址；部分分支未 await" />
              <UmlArrow />
              <UmlAction title="更新本地 confirmed" note="syncIsConfirmStatus 写 checkout.regular_shipping.is_confirm" />
              <UmlArrow />
              <UmlAction title="更新配送方式与支付初始化" note="updateShippingMethods；done 后 emit initPayment" />
              <UmlArrow />
              <UmlStartEnd label="Shipping 完成或回到表单" end />
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["分类", "对象", "规则"]} rows={shippingBillingRows} striped />
        <Divider />
        <Table headers={["环节", "代码位置", "接口 / await 规则"]} rows={shippingSubmitRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：Shipping Address 边界场景</H2>
        <Card>
          <CardHeader>编辑、取消、异常与配送可用性</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="Shipping Step" />
              <UmlArrow />
              <UmlAction title="准备地址上下文" note="过滤不可配送国家地址；默认国家优先 quote 地址，其次 global address，最后 store 默认国家" />
              <UmlArrow />
              <UmlAction title="初始化配送方式" note="无完整地址时按国家 setShippingCountryCode；完整且 confirmed 时可重算；未 confirmed 时使用 quote 现有 methods" />
              <UmlArrow />
              <UmlDecision title="用户或系统触发？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="编辑 / 新增 / 取消">
                  <UmlAction title="切换展示状态" note="done、地址列表、地址表单之间切换" />
                  <UmlArrow />
                  <UmlAction title="同步 confirmed" note="写 checkout.regular_shipping.is_confirm" />
                </UmlBranch>
                <UmlBranch label="校验 / 配送异常">
                  <UmlAction title="阻止完成" note="MX CURP/RFC 缺失、未选地址、无配送方式、地址字段不完整" />
                  <UmlArrow />
                  <UmlAction title="展开或保持表单" note="提示用户补齐地址或选择可用地址" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="是否满足完成条件？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="是">
                  <UmlStartEnd label="显示 Saved Address" end />
                </UmlBranch>
                <UmlBranch label="否">
                  <UmlStartEnd label="保持 Shipping 未完成" end />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["场景", "代码位置", "行为"]} rows={shippingEdgeRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：地址提交后的结账操作</H2>
        <Card>
          <CardHeader>Shipping Done 之后</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="地址提交成功" />
              <UmlArrow />
              <UmlAction title="读取 quote 响应" note="地址接口返回默认 selected shipping method 与 available methods" />
              <UmlArrow />
              <UmlDecision title="是否有可用配送方式？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="没有">
                  <UmlAction title="显示无配送方式提示" note="shipping.no.available；Shipping Step 保持未完成" />
                  <UmlArrow />
                  <UmlStartEnd label="支付与商品模块不可操作" end />
                </UmlBranch>
                <UmlBranch label="有">
                  <UmlAction title="进入 Done 状态" note="支付方式和商品条目模块解除遮罩" />
                  <UmlArrow />
                  <UmlAction title="初始化支付方式" note="首次或国家变化时加载 payment methods" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="用户操作类型？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="支付 / 配送">
                  <UmlAction title="选择支付方式" note="setPaymentMethodOnCart；必要时同步 billing" />
                  <UmlArrow />
                  <UmlAction title="切换配送方式" note="仅多个 shipping method 时调用 setShippingMethodsOnCart" />
                </UmlBranch>
                <UmlBranch label="商品 / 金额调整">
                  <UmlAction title="更新数量或移除商品" note="更新 quote 后刷新配送方式、价格、优惠和错误" />
                  <UmlArrow />
                  <UmlDecision title="移除后是否还有商品？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="无">
                      <UmlAction title="返回购物车" note="quote items 为空时中断 checkout" />
                    </UmlBranch>
                    <UmlBranch label="有">
                      <UmlAction title="保持 Checkout 可操作" note="刷新 items、prices、shipping、coupons、cart_errors" />
                    </UmlBranch>
                  </Grid>
                  <UmlArrow />
                  <UmlAction title="优惠券 / Pro / 积分互斥" note="优惠券与 Pro 折扣、积分互斥结果由 quote 响应体现" />
                  <UmlArrow />
                  <UmlAction title="免税证应用/移除" note="更新 prices、applied_exemption、applied_coupons、cart_errors" />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["流程", "代码位置", "规则"]} rows={postShippingRows} striped />
        <Divider />
        <Table headers={["模块", "代码位置", "规则 / 互斥"]} rows={quoteAdjustmentRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：支付方式与 Billing Address</H2>
        <Card>
          <CardHeader>独立账单地址</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="选择支付方式" />
              <UmlArrow />
              <UmlDecision title="支付方式是否 require_billing？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="是">
                  <UmlAction title="展示 BillingStep" note="允许 same as shipping 或独立 billing address" />
                  <UmlArrow />
                  <UmlDecision title="是否取消 same as shipping？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="取消">
                      <UmlAction title="编辑账单地址" note="AddressForm 提交 saveBilling(sameAsShipping=false)" />
                      <UmlArrow />
                      <UmlAction title="只更新 quote billing" note="customerAddressId=null，save_in_address_book=false，不写账户地址簿" />
                      <UmlArrow />
                      <UmlAction title="Cancel 可恢复旧状态" note="cancelEdit 恢复 oldBillingDetails" />
                    </UmlBranch>
                    <UmlBranch label="保持">
                      <UmlAction title="账单跟随邮寄地址" note="saveBilling(sameAsShipping=true)" />
                    </UmlBranch>
                  </Grid>
                </UmlBranch>
                <UmlBranch label="否">
                  <UmlAction title="强制恢复跟随" note="若之前独立 billing，则设置 shippingSameAsBilling=true" />
                  <UmlArrow />
                  <UmlAction title="保存 shipping 作为 billing" note="再保存当前支付方式" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="保存支付方式" note="setPaymentMethodOnCart；Adyen 子方式转换为 code=adyen 并带 adyen.payment_method" />
              <UmlArrow />
              <UmlStartEnd label="quote billing / payment 更新" end />
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["场景", "代码位置", "规则"]} rows={billingPaymentRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：下单与扣款入口</H2>
        <Card>
          <CardHeader>Place Order</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="点击 Place Order" />
              <UmlArrow />
              <UmlAction title="支付组件前置校验" note="Stripe 校验卡片字段；Adyen 校验当前组件" />
              <UmlArrow />
              <UmlDecision title="前置校验是否通过？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="否">
                  <UmlAction title="中断下单流程" note="不刷新 quote，不调用 placeOrderV2，不进入扣款" />
                  <UmlArrow />
                  <UmlStartEnd label="停留 Checkout" end />
                </UmlBranch>
                <UmlBranch label="是">
                  <UmlAction title="继续下单" note="进入最新 quote 校验" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="强制拉取最新 quote" note="loadQuoteById(quoteId, true)，用最新报价单更新页面" />
              <UmlArrow />
              <UmlDecision title="quote 刷新是否成功？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="失败">
                  <UmlAction title="提示错误并停留" note="关闭 pageMask，用户继续调整地址、商品、优惠或支付方式" />
                  <UmlArrow />
                  <UmlStartEnd label="停留 Checkout" end />
                </UmlBranch>
                <UmlBranch label="成功">
                  <UmlAction title="调用 placeOrderV2" note="传 cart_id 与 purchase_order_number" />
                  <UmlArrow />
                  <UmlDecision title="是否生成订单？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="失败">
                      <UmlAction title="提示错误并停留" note="下单接口错误或无返回订单" />
                    </UmlBranch>
                    <UmlBranch label="成功">
                      <UmlAction title="保存订单基础信息" note="保存 order_number / uuid，并记录 affiliate" />
                      <UmlArrow />
                      <UmlAction title="清理购物车数据" note="Buy Now 清理本地 cart id；普通 quote 登录刷新购物车，匿名清空购物车" />
                      <UmlArrow />
                      <UmlAction title="清除购物车优惠券相关数据" note="resetCartCoupon + resetCartErrors，避免旧优惠券错误影响下一次购物车" />
                      <UmlArrow />
                      <UmlAction title="写入 pending order" note="保存 orderUUID / anon_order_token / isLogin" />
                      <UmlArrow />
                      <UmlAction title="清除 checkout 本地邮箱数据" note="removeLocalStorageItem('checkout')" />
                      <UmlArrow />
                      <UmlAction title="进入扣款环节" note="按支付方式分流：Bank / Adyen / 其他在线支付" />
                    </UmlBranch>
                  </Grid>
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlStartEnd label="扣款 / 收银台 / 线下支付" end />
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["环节", "代码位置", "规则"]} rows={placeOrderRows} striped />
        <Divider />
        <Table headers={["支付方式", "代码位置", "扣款入口 / 回退"]} rows={paymentDeductionRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：Checkout 登录入口与多窗口同步</H2>
        <Card>
          <CardHeader>登录入口与页面恢复</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="用户处于 Checkout 页面" />
              <UmlArrow />
              <UmlDecision title="是否需要登录？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="主动登录入口">
                  <UmlAction title="Checkout 内无显式入口" note="未挂载 AccountActionSidebar / AccountActionPopup" />
                  <UmlArrow />
                  <UmlAction title="回到购物车页分流" note="购物车 Secure Checkout 承担登录/注册/Guest 选择" />
                </UmlBranch>
                <UmlBranch label="登录态失效">
                  <UmlAction title="提示登录过期" note="quote.login.expired" />
                  <UmlArrow />
                  <UmlAction title="跳转 /cart" note="不在 Checkout 内打开登录弹窗" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="是否多窗口/页面恢复？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="首次进入 / BFCache 恢复">
                  <UmlAction title="拉取最新 Quote" note="checkCartStatus -> loadQuoteById" />
                  <UmlArrow />
                  <UmlAction title="按最新数据呈现" note="可用则进入核心 checkout 组件" />
                </UmlBranch>
                <UmlBranch label="窗口重新可见">
                  <UmlAction title="校验 Quote 可用性" note="visibilitychange -> quoteIsAvailable" />
                  <UmlArrow />
                  <UmlAction title="不可用则跳首页" note="提示 cart.expired；当前不完整刷新 quote 展示" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlStartEnd label="下单前仍会强制刷新 Quote" end />
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["场景", "代码位置", "当前表现"]} rows={checkoutLoginAndSyncRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：Quote 异常与失效回退</H2>
        <Card>
          <CardHeader>统一异常分支</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="Quote 相关接口调用" />
              <UmlArrow />
              <UmlDecision title="返回错误类型？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="登录失效 / Quote 不存在">
                  <UmlAction title="提示并返回购物车" note="CART_AUTHORIZATION_FAILED / CART_NOT_FOUND -> /cart" />
                  <UmlArrow />
                  <UmlStartEnd label="中断当前操作" end />
                </UmlBranch>
                <UmlBranch label="Quote inactive / items empty">
                  <UmlAction title="判定是否已转订单" note="CART_NOT_ACTIVE -> whetherCartConvertedIntoOrder" />
                  <UmlArrow />
                  <UmlAction title="跳转目标页" note="订单页 / 收银台 / 首页 / 购物车" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="是否页面恢复或登录态变化？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="页面恢复">
                  <UmlAction title="quoteIsAvailable 校验" note="不可用则提示 cart.expired 并跳首页" />
                </UmlBranch>
                <UmlBranch label="登录态失效">
                  <UmlAction title="清理支付组件" note="清理 Stripe Elements，提示 quote.login.expired，跳 /cart" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="错误发生在哪类操作？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="地址 / 配送 / 支付设置">
                  <UmlAction title="保存地址异常" note="useShipping / useBilling：授权失效或 cart not found 跳 /cart，其他错误提示" />
                  <UmlArrow />
                  <UmlAction title="保存配送/支付方式异常" note="useShippingProvider / usePaymentProvider：关键 quote 错误跳 /cart，普通错误提示或记录" />
                </UmlBranch>
                <UmlBranch label="商品 / 金额 / 下单">
                  <UmlAction title="商品数量或移除异常" note="失败时跳 /cart、clear quote 或 reset 数量输入" />
                  <UmlArrow />
                  <UmlAction title="优惠券/积分/免税证异常" note="授权失效、cart not found 跳 /cart；cart inactive 分支可能 clear quote" />
                  <UmlArrow />
                  <UmlAction title="下单异常" note="刷新 quote 或 placeOrderV2 关键错误跳 /cart；普通错误停留 Checkout" />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["场景", "代码位置", "处理规则"]} rows={quoteExceptionRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：可优化点</H2>
        <Card>
          <CardHeader>Quote Checkout 后续优化方向</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="可优化点" />
              <UmlArrow />
              <Grid columns={2} gap={16}>
                <UmlBranch label="地址设置逻辑">
                  <UmlAction title="收敛 shipping / billing 分支" note="降低 sameAsShipping、地址簿、匿名邮箱和国家变化的耦合" />
                  <UmlArrow />
                  <UmlAction title="减少重复状态同步" note="统一 quote 地址状态、localStorage confirmed 和支付初始化触发点" />
                </UmlBranch>
                <UmlBranch label="错误信息字段">
                  <UmlAction title="统一错误字段结构" note="收敛接口错误、cart_errors、商品行错误和金额调整错误" />
                  <UmlArrow />
                  <UmlAction title="提升展示与恢复一致性" note="页面可按统一错误类型决定提示、禁用、跳转或重试" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlStartEnd label="降低结账链路维护成本" end />
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["方向", "模块", "期望"]} rows={optimizationRows} striped />
      </Stack>

    </Stack>
  );
}
