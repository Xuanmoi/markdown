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

const findings = [
  [
    "用户分登录/匿名；登录用户再区分 Pro / Points；加购时按登录态调用不同接口。",
    "useCart.addItem 通过 getToken() 分支：登录 addItemToShoppingCart，匿名 addItemAnonymousShoppingCart。",
  ],
  [
    "简单产品有自定义选项时，列表页加购会跳 PDP；PDP 上所有 options 都按必选校验。",
    "helpers/cart/addToCart.ts 注释写“只要有 option 都是必选”；ConfigurableProduct.vue validate(productCustom)。",
  ],
  [
    "复杂产品在列表页不直接加购，统一跳 PDP；PDP 上必须选完整 configurable attributes，且若有自定义选项也必须选。",
    "domain-graph 业务规则：可配置产品必须选择所有属性；ConfigurableProduct.vue validate(productConfiguration, productCustom)。",
  ],
  [
    "加购前会校验库存：简单产品检查 stock_status 和 only_x_left_in_stock；复杂产品检查 variant uid 与 variant stock_status。",
    "ConfigurableProduct.vue canAddToCart；helpers/cart/addToCart.ts 对列表页 SimpleProduct OUT_OF_STOCK 跳 PDP。",
  ],
  [
    "Points 用户显示可获得积分预估；匿名用户显示注册/会员权益提示和折扣展示，不展示 points 预估。",
    "ProductPriceNew.vue：PointPrice 调 calcRewardPoint；AnonyPrice 固定展示 deal.after.register / 2% benefit 文案。",
  ],
];

const interfaceRows = [
  ["列表/卡片加购", "helpers/cart/addToCart.ts", "SimpleProduct 可直接加购；SimpleProduct 有 options 或 ConfigurableProduct 跳 PDP。"],
  ["PDP 加购", "ConfigurableProduct.vue", "统一处理 Simple / Configurable 的配置校验、库存校验、productCustom/productConfiguration。"],
  ["购物车加购 Module", "useCart.addItem", "按 getToken() 分为登录真实购物车与匿名虚拟购物车。"],
  ["登录 Adapter", "addItemToShoppingCartCommand", "POST addItemToShoppingCart，actionItem + need_preview。"],
  ["匿名 Adapter", "addItemAnonymousShoppingCartCommand", "POST addItemAnonymousShoppingCart，本地 cart_items + country + coupon + action_item。"],
  ["价格展示", "ProductPriceNew.vue", "ProPrice / PointPrice / AnonyPrice 按用户身份展示不同价格权益。"],
];

const optionRows = [
  ["SimpleProduct 无 options", "允许直接加购", "列表页或 PDP 均可进入 useCart.addItem。"],
  ["SimpleProduct 有 options", "列表页跳 PDP；PDP 必选 productCustom", "当前代码把所有 product.options 都视为必选。"],
  ["ConfigurableProduct", "列表页跳 PDP；PDP 必选 productConfiguration", "必须选完整 configurable_options 后才有 variant。"],
  ["ConfigurableProduct + options", "还必须选 productCustom", "productConfiguration 和 productCustom 任一为空都不能加购。"],
  ["库存不足/无货", "阻止加购", "PDP 提示 canAddToCart.exceedStock；列表页无货跳 PDP 并提示 out stock。"],
];

const cartFindings = [
  [
    "匿名和登录购物车页都支持更新数量、删除条目、设置/移除优惠券、设置配送国家。",
    "useCart.updateItemQty/removeItem/applyCoupon/setShippingCountryCode 均按登录态分流。",
  ],
  [
    "登录和匿名调用两套接口；匿名侧会把本地 cart_items、country_code、coupon_code 一起提交给预览/操作接口。",
    "匿名：updateItemAnonymousShoppingCart、previewAnonymousShoppingCart、setAnonymousShoppingCartCouponCode、setAnonymousShoppingCartCountryCode。",
  ],
  [
    "条目异常会显示在对应商品行，部分异常会禁用勾选框；select all 只作用于可勾选商品。",
    "useCartView.products 映射 issue_message / disabledCheckbox；isAllChecked 和 handleAllCheckboxClick 过滤 DISABLED_CHECKBOX_CODE。",
  ],
  [
    "进入 checkout 必须至少一个已勾选条目；summary 的 items 是 checked_totals；全局 cart 图标数量是整个购物车总数量。",
    "Cart.vue checkout 按 totalItems===0 禁用；useCartView.totalItems 来自 cart.checked_totals；loadTotalQty 独立请求总数量。",
  ],
  [
    "匿名/Points 的价格显示逻辑相同分支：展示当前成交价；存在会员价差异时显示划线原价和 member price/注册后优惠标识。",
    "itemsInCartPrice.vue：isPointMember || !isLogin 分支，showMemberPrice 时展示 full_original_price 和标识。",
  ],
  [
    "Pro 会员如果没有实际使用 Pro 折扣，只显示当前单价；只有 totals.used_pro_discount 为真时才展示原价、Pro 折后价和单品 save。",
    "Cart.vue isUseProDiscount；itemsInCartPrice.vue Pro 分支；summary 中 used_pro_discount 决定 pro savings 或 pro.not.applied。",
  ],
];

const cartOperationRows = [
  ["加载购物车页", "useCartView.onMounted", "先 loadTotalQty，再 loadCart，然后根据配送国家计算/刷新运费。"],
  ["更新数量", "updateItemQty", "登录走 updateItemToShoppingCart；匿名走 updateItemAnonymousShoppingCart。"],
  ["删除条目", "removeItem", "登录走 removeItemToShoppingCart；匿名通过过滤本地条目后 previewAnonymousShoppingCart 刷新。"],
  ["设置优惠券", "CartCouponCode", "登录 apply/removeCouponForCart；匿名 apply/removeCouponForVirtualCart。"],
  ["设置配送国家", "CartProductEstimateShipping", "登录 setShoppingCartCountryCode；匿名 setAnonymousShoppingCartCountryCode。"],
  ["勾选单项", "handleCheckboxClick", "登录调用 checking/uncheckingShoppingCartItem；匿名更新本地 checked 后重新 loadCart。"],
  ["全选", "handleAllCheckboxClick", "禁用异常条目会被强制 unchecked；登录同步 checking/unchecking，匿名重新 loadCart。"],
  ["进入结账", "goToCheckout", "登录购物车转真实 quote；匿名把 checked 条目写入 quoteStore 形成虚拟 quote。"],
];

const cartPriceRows = [
  ["匿名用户", "条目价", "当前成交价；如有会员价差异，显示划线原价和 deal.after.register。"],
  ["Points 用户", "条目价", "当前成交价；如有会员价差异，显示划线原价和 member.price。summary 额外展示 reward.after.pay。"],
  ["Pro 用户未使用 Pro 折扣", "条目价", "只展示当前单价；summary 的 Pro Saving 显示 pro.not.applied。"],
  ["Pro 用户使用 Pro 折扣", "条目价", "展示 Pro 折后价、划线原价、单品 item.save；summary 展示 pro.save 金额。"],
  ["Summary items", "数量", "cart.checked_totals，表示当前已勾选条目的产品数量。"],
  ["Header cart icon", "数量", "loadTotalQty 获取整个购物车产品数量，不等同于 checked_totals。"],
];

const couponInvalidRows = [
  [
    "持久化来源",
    "useCartStore.persist",
    "本地 key 为 vsf-cart，持久化 cart.coupon_code、cartCouponError.coupon_code、cartCouponError.cart_errors。",
  ],
  [
    "接口覆盖",
    "useCart.load / applyCoupon",
    "购物车相关接口返回 coupon_code 与 cart_errors 后，updateCartData 会同步到 cartCouponError；但登录和匿名使用不同接口。",
  ],
  [
    "登录用户校验接口",
    "previewShoppingCart / setShoppingCartCouponCode",
    "进入购物车时调用 previewShoppingCart；手动应用优惠券时调用 setShoppingCartCouponCode，返回的 cart_errors 用于首次失效提示。",
  ],
  [
    "匿名用户校验接口",
    "previewAnonymousShoppingCart / setAnonymousShoppingCartCouponCode",
    "进入购物车时把本地 cart_items、country_code、coupon_code 传给 previewAnonymousShoppingCart；手动应用优惠券走 setAnonymousShoppingCartCouponCode。",
  ],
  [
    "首次提示触发",
    "CartCouponCode watch(cartCouponError.cart_errors)",
    "组件挂载时 immediate 监听 coupon 类型错误，设置 applyCouponMsg 展示错误信息。",
  ],
  [
    "首次后清理",
    "resetCartCoupon / resetCartErrors / resetCoupon",
    "展示错误后清掉 cartCouponError.coupon_code、cartCouponError.cart_errors 和 cart.coupon_code。",
  ],
  [
    "后续访问",
    "本地已无 coupon 错误上下文",
    "再次进入购物车不会再从本地恢复同一条失效优惠券错误，除非接口再次返回新的 coupon 错误。",
  ],
];

const anonymousCheckoutRows = [
  [
    "Continue as Guest",
    "Cart.vue @continueAsGuest=goToCheckout",
    "不登录、不合并购物车；getAnonymousQuoteData 只取 checked 条目，写入 quoteStore，进入 checkout。",
  ],
  [
    "Login",
    "SidebarLoginForm.vue",
    "actionType=checkout 时先 copyCartData；登录成功后 handleUserAction(mergeCart=true) 合并匿名购物车；afterLogin 再 goToCheckout('checkout')。",
  ],
  [
    "Register",
    "SidebarRegisterForm.vue",
    "普通注册成功后同样先 copyCartData，再 mergeGuestCart；afterRegister 后用 copyCart 生成真实 quote。",
  ],
  [
    "Register Pro",
    "SidebarRegisterProForm.vue",
    "Pro 注册流程与普通注册一致，但注册后用户身份变为 Pro，后续真实购物车/quote 价格按 Pro 规则计算。",
  ],
  [
    "copyCart 快照",
    "cartStore.copyCartData + converseShoppingCartToQuote('checkout')",
    "保存点击 checkout 当下的匿名 items/coupon_code；登录合并后，用 customize_quote 从 copyCart 创建真实 quote，避免合并后的购物车污染本次结账快照。",
  ],
];

const mergeCartRows = [
  [
    "触发入口",
    "SidebarLoginForm / SidebarRegisterForm / SidebarRegisterProForm / AccountActionPopup / Login.vue / Create.vue / sociallogin callback",
    "登录、注册、Pro 注册、社交登录等成功后都会调用 handleUserAction({ mergeCart: true })，进入合并匿名购物车流程。",
  ],
  [
    "Checkout 入口快照",
    "AccountActionSidebar + cartStore.copyCartData",
    "如果 actionType=checkout，登录/注册前先拷贝匿名购物车的 items 与 coupon_code；后续本次结账用 copyCart 创建 quote，避免合并后的完整登录购物车污染本次结账。",
  ],
  [
    "Buy Now 清理",
    "useUser.mergeGuestCart",
    "合并前如果存在匿名 buy now cart id，会移除 buyNowCartId，并清空 buyNowCartData；Buy Now 不参与普通购物车合并。",
  ],
  [
    "匿名购物车为空",
    "useUser.mergeGuestCart",
    "如果 cart.value.items 为空，不调用合并接口，直接 loadCart 加载登录用户远程购物车，然后 loadTotalQty。",
  ],
  [
    "匿名购物车有条目",
    "useCart.mergeCart",
    "调用 mergeShoppingCartShoppingCartCommand，把当前匿名 cart.items 与 coupon_code 传给 mergeShoppingCartShoppingCart。",
  ],
  [
    "合并入参格式化",
    "mergeShoppingCartShoppingCartCommand",
    "先 clone 当前 cart 并 reverse items，再用 getFormattedCartItemsForParams 转成接口需要的条目；qty 缺失时补 1，并记录 Sentry 日志。",
  ],
  [
    "合并成功",
    "useCart.mergeCart",
    "使用接口返回的 shopping_cart 更新 cartStore：items、coupon_code、prices、country_code、checked_totals、shipping_method、cart_errors。",
  ],
  [
    "合并失败",
    "useCart.mergeCart",
    "如果 GraphQL errors 或 success=false，catch 中 clearCartData、记录 Sentry，并写入 error.mergeCart；handleUserAction 后续仍会继续收藏、埋点、重定向逻辑。",
  ],
  [
    "合并后刷新数量",
    "useUser.mergeGuestCart",
    "无论是合并还是直接加载登录购物车，都会调用 loadTotalQty，刷新 header/cart icon 的全量数量。",
  ],
];

const authFallbackRows = [
  [
    "应用优惠券",
    "applyCouponForCart",
    "登录接口返回 CART_AUTHORIZATION_FAILED 时，回退 applyCouponForVirtualCart，按匿名购物车参数重新应用优惠券。",
  ],
  [
    "移除优惠券",
    "removeCouponForCart",
    "登录接口返回 CART_AUTHORIZATION_FAILED 时，回退 removeCouponForVirtualCart，即用匿名预览接口传空 couponCode 刷新购物车。",
  ],
  [
    "设置配送国家",
    "setShippingCountryCode",
    "登录接口返回 CART_AUTHORIZATION_FAILED 时，回退 setShippingCountryCodeForVirtual，使用本地 cart_items/country/coupon 重新计算匿名运费。",
  ],
  [
    "购物车转 Quote",
    "converseShoppingCartToQuote",
    "登录转真实 quote 失败且错误为 CART_AUTHORIZATION_FAILED 时，改用 getAnonymousQuoteData 写入 quoteStore，并直接跳 checkout。",
  ],
  [
    "勾选/取消勾选",
    "checkingShoppingCartItem / uncheckingShoppingCartItem",
    "登录勾选接口遇到 CART_AUTHORIZATION_FAILED 只 return，不弹错误；前端本地 checked 已先更新。",
  ],
];

const goToCheckoutRows = [
  [
    "登录用户正常路径",
    "useCartView.goToCheckout -> converseShoppingCartToQuote",
    "调用登录接口创建/获取真实 quote；拿到 quoteId 后写入 quoteStore，并跳转 checkout?id=quoteId。",
  ],
  [
    "匿名用户正常路径",
    "useCartView.goToCheckout -> getAnonymousQuoteData",
    "不调用转真实 quote 接口；从当前 cart 中取 checked 条目、shipping_addresses、appliedCoupon、prices，写入 quoteStore，形成虚拟 quote。",
  ],
  [
    "登录接口返回 CART_VALID_ITEM_EMPTY",
    "converseShoppingCartToQuote catch",
    "说明服务端判定有效条目为空；执行 load() + loadTotalQty() 刷新当前购物车数据，quoteId 为空则不跳转。",
  ],
  [
    "登录接口返回 CART_AUTHORIZATION_FAILED",
    "converseShoppingCartToQuote catch",
    "不继续真实 quote；降级为 getAnonymousQuoteData 写入 quoteStore，并跳转 checkout。",
  ],
];

const optimizationRows = [
  [
    "购物车接口简化",
    "商品条目字段层级过深，购物车页需要在 product / item_info / configured_variant / prices / reporting_data / error_message 之间做多次适配。",
    "期望后端或 BFF 输出面向购物车页的稳定 CartItem DTO，只保留展示、操作、校验必要字段，减少无用信息与前端格式化逻辑。",
  ],
  [
    "登录/匿名接口统一（暂定）",
    "当前登录用户走远程真实购物车接口，匿名用户依赖 localStorage + 预览接口，导致 add/update/remove/coupon/country/checkout 都有双分支。",
    "期望匿名与登录都共用同一套远程购物车接口；匿名购物车也由远程存储和计算，前端只保存轻量身份/引用，降低本地状态同步和降级复杂度。",
  ],
];

function UmlStartEnd({ label, end = false }: { label: string; end?: boolean }) {
  const theme = useHostTheme();
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 96,
          height: 34,
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
          width: 120,
          height: 120,
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
            width: 92,
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

export default function CartUmlCanvas() {
  return (
    <Stack gap={22} style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
      <Stack gap={8}>
        <H1>购物车流程 UML</H1>
        <Text tone="secondary">
          基于你的模块描述，结合 <Code>.understand-anything</Code> 的商品目录/购物车领域图谱，以及 <Code>helpers/cart/addToCart.ts</Code>、<Code>ConfigurableProduct.vue</Code>、<Code>Cart.vue</Code>、<Code>useCartView</Code>、<Code>useCart</Code> 等代码校验。
        </Text>
      </Stack>

      <Stack gap={10}>
        <H2>加购场景说明</H2>
        <Table headers={["业务描述", "代码依据"]} rows={findings} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：商品入口加购</H2>
        <Card>
          <CardHeader>列表/卡片入口</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="开始" />
              <UmlArrow />
              <UmlAction title="点击 Add to Cart" note="helpers/cart/useAddToCart" />
              <UmlArrow />
              <UmlDecision title="产品类型？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="SimpleProduct">
                  <UmlDecision title="是否有 options 或无货？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="否">
                      <UmlAction title="useCart.addItem" note="直接进入购物车加购 Module" />
                      <UmlArrow />
                      <UmlStartEnd label="加购完成" end />
                    </UmlBranch>
                    <UmlBranch label="是">
                      <UmlAction title="跳转 PDP" note="提示 product.option.required 或 out stock" />
                      <UmlArrow />
                      <UmlStartEnd label="等待选择" end />
                    </UmlBranch>
                  </Grid>
                </UmlBranch>
                <UmlBranch label="ConfigurableProduct">
                  <UmlAction title="跳转 PDP" note="复杂产品不在列表页直接加购" />
                  <UmlArrow />
                  <UmlStartEnd label="等待选择" end />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：PDP 校验与加购</H2>
        <Card>
          <CardHeader>PDP Add to Cart</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="开始" />
              <UmlArrow />
              <UmlAction title="点击 PDP Add to Cart" note="ConfigurableProduct.vue addToCart" />
              <UmlArrow />
              <UmlAction title="标记必选提示" note="isProductRequireShowInfo" />
              <UmlArrow />
              <UmlDecision title="配置/自定义选项是否完整？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="否">
                  <UmlAction title="滚动到选项区" note="scrollSelectElementIntoView" />
                  <UmlArrow />
                  <UmlStartEnd label="阻止加购" end />
                </UmlBranch>
                <UmlBranch label="是">
                  <UmlDecision title="库存是否允许？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="否">
                      <UmlAction title="提示库存不足" note="canAddToCart.exceedStock" />
                      <UmlArrow />
                      <UmlStartEnd label="阻止加购" end />
                    </UmlBranch>
                    <UmlBranch label="是">
                      <UmlAction title="useCart.addItem" note="带 productCustom / productConfiguration" />
                      <UmlArrow />
                      <UmlStartEnd label="进入购物车页" end />
                    </UmlBranch>
                  </Grid>
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：登录态分流</H2>
        <Card>
          <CardHeader>useCart.addItem</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="开始" />
              <UmlArrow />
              <UmlAction title="生成 actionItem" note="getActionItemForCart：sku、qty、customizable_options、selected_options、parent_sku" />
              <UmlArrow />
              <UmlDecision title="是否有 customerToken？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="登录用户">
                  <UmlAction title="addItemToShoppingCart" note="真实 Shopping Cart，加 need_preview" />
                  <UmlArrow />
                  <UmlAction title="updateCartData" note="items / prices / coupon / country / shipping_method" />
                  <UmlArrow />
                  <UmlStartEnd label="成功提示 + GTM" end />
                </UmlBranch>
                <UmlBranch label="匿名用户">
                  <UmlAction title="refreshCart" note="读取 localStorage vsf-cart" />
                  <UmlArrow />
                  <UmlAction title="addItemAnonymousShoppingCart" note="cart_items + country + coupon + action_item" />
                  <UmlArrow />
                  <UmlAction title="updateCartData" note="匿名预览结果写回本地 cartStore" />
                  <UmlArrow />
                  <UmlStartEnd label="成功提示 + GTM" end />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
      </Stack>

      <Stack gap={10}>
        <H2>价格与权益展示</H2>
        <Grid columns={3} gap={14}>
          <Card>
            <CardHeader>Pro 用户</CardHeader>
            <CardBody>
              <Text>
                通过 <Code>ProductPriceNew</Code> 渲染 <Code>ProPrice</Code>。展示 Pro Price、You Save、折扣详情；折扣比例来自用户 Pro 账户，价格来自商品价格字段。
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>Points 用户</CardHeader>
            <CardBody>
              <Text>
                渲染 <Code>PointPrice</Code>，调用 <Code>calcRewardPoint</Code> 根据商品金额预估可获得积分与金额。
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>匿名用户</CardHeader>
            <CardBody>
              <Text>
                渲染 <Code>AnonyPrice</Code>，展示特价/折扣和注册后权益提示，例如 <Code>deal.after.register</Code>、匿名 2% benefit 文案。
              </Text>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Stack gap={10}>
        <H2>选项与接口对照</H2>
        <Table headers={["场景", "校验结果", "说明"]} rows={optionRows} striped />
        <Divider />
        <Table headers={["模块", "文件", "职责"]} rows={interfaceRows} striped />
      </Stack>

      <Divider />

      <Stack gap={10}>
        <H2>购物车页面场景说明</H2>
        <Table headers={["业务描述", "代码依据"]} rows={cartFindings} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：购物车页加载与展示</H2>
        <Card>
          <CardHeader>Cart.vue + useCartView</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="进入 Cart" />
              <UmlArrow />
              <UmlAction title="加载全购物车数量" note="loadTotalQty：用于 header/cart icon" />
              <UmlArrow />
              <UmlAction title="加载购物车数据" note="loadCart：items、prices、coupon、checked_totals、shipping_method、cart_errors" />
              <UmlArrow />
              <UmlAction title="映射商品行视图" note="products：issue_message、disabledCheckbox、options、价格、配送信息" />
              <UmlArrow />
              <UmlAction title="计算/刷新运费" note="Shipping to 国家变化后触发 set country code" />
              <UmlArrow />
              <UmlStartEnd label="页面可操作" end />
            </Stack>
          </CardBody>
        </Card>
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：购物车页操作分流</H2>
        <Card>
          <CardHeader>数量 / 删除 / 优惠券 / 配送国家</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="用户操作" />
              <UmlArrow />
              <UmlDecision title="操作类型？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="更新数量 / 删除">
                  <UmlDecision title="是否登录？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="登录">
                      <UmlAction title="真实购物车接口" note="updateItemToShoppingCart / removeItemToShoppingCart" />
                      <UmlArrow />
                      <UmlAction title="刷新 cartStore" note="items、prices、checked_totals、errors" />
                    </UmlBranch>
                    <UmlBranch label="匿名">
                      <UmlAction title="匿名购物车接口" note="updateItemAnonymousShoppingCart；删除通过 previewAnonymousShoppingCart" />
                      <UmlArrow />
                      <UmlAction title="刷新本地 cartStore" note="保留 country/coupon/checked 状态参与预览" />
                    </UmlBranch>
                  </Grid>
                </UmlBranch>
                <UmlBranch label="优惠券 / 配送国家">
                  <UmlDecision title="是否登录？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="登录">
                      <UmlAction title="真实购物车接口" note="apply/remove coupon；setShoppingCartCountryCode" />
                      <UmlArrow />
                      <UmlAction title="刷新 summary 与运费" note="discount、shipping_method、prices" />
                    </UmlBranch>
                    <UmlBranch label="匿名">
                      <UmlAction title="匿名预览接口" note="apply/remove coupon；setAnonymousShoppingCartCountryCode" />
                      <UmlArrow />
                      <UmlAction title="刷新本地 summary 与运费" note="cart_items + country_code + coupon_code" />
                    </UmlBranch>
                  </Grid>
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlStartEnd label="操作完成" end />
            </Stack>
          </CardBody>
        </Card>
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：勾选与进入结账</H2>
        <Card>
          <CardHeader>Checkbox + Checkout Gate</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="购物车页" />
              <UmlArrow />
              <UmlAction title="展示商品勾选框" note="异常 code 命中 DISABLED_CHECKBOX_CODE 时禁用" />
              <UmlArrow />
              <UmlDecision title="用户点击单选或全选？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="单选">
                  <UmlAction title="本地切换 checked" note="登录同步 checking/unchecking；匿名重新 loadCart" />
                </UmlBranch>
                <UmlBranch label="Select All">
                  <UmlAction title="只勾选可用条目" note="不可勾选异常条目强制 checked=false" />
                  <UmlArrow />
                  <UmlAction title="同步全选结果" note="登录调用 checking/unchecking；匿名重新 loadCart" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="checked_totals > 0？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="否">
                  <UmlAction title="禁用 Secure Checkout" note="Cart.vue totalItems === 0" />
                  <UmlArrow />
                  <UmlStartEnd label="留在购物车" end />
                </UmlBranch>
                <UmlBranch label="是">
                  <UmlDecision title="是否登录？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="登录">
                      <UmlAction title="购物车转真实 quote" note="converseShoppingCartToQuote，然后跳 checkout?id=quoteId" />
                    </UmlBranch>
                    <UmlBranch label="匿名">
                      <UmlAction title="打开 AccountActionSidebar" note="可 Continue as Guest、Login、Register、Register Pro" />
                    </UmlBranch>
                  </Grid>
                  <UmlArrow />
                  <UmlStartEnd label="进入下一步" end />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：匿名 Secure Checkout</H2>
        <Card>
          <CardHeader>AccountActionSidebar 分流</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="匿名点击 checkout" />
              <UmlArrow />
              <UmlAction title="打开账户侧栏" note="Cart.vue openSidebar('checkout')" />
              <UmlArrow />
              <UmlDecision title="用户选择？" />
              <Stack gap={12}>
                <UmlBranch label="Continue as Guest">
                  <UmlAction title="直接 goToCheckout" note="不登录、不合并购物车" />
                  <UmlArrow />
                  <UmlAction title="生成虚拟 quote" note="getAnonymousQuoteData 只取 checked 条目、配送地址、优惠券、prices" />
                  <UmlArrow />
                  <UmlStartEnd label="进入 checkout" end />
                </UmlBranch>
                <UmlBranch label="Login">
                  <UmlAction title="copyCartData" note="保存匿名购物车 items 与 coupon_code 快照" />
                  <UmlArrow />
                  <UmlAction title="登录成功后合并购物车" note="handleUserAction -> mergeGuestCart -> mergeCart" />
                  <UmlArrow />
                  <UmlAction title="用 copyCart 转真实 quote" note="converseShoppingCartToQuote('checkout') 传 customize_quote" />
                  <UmlArrow />
                  <UmlStartEnd label="进入 checkout?id" end />
                </UmlBranch>
                <UmlBranch label="Register / Register Pro">
                  <UmlAction title="copyCartData" note="注册前保存匿名购物车快照" />
                  <UmlArrow />
                  <UmlAction title="注册成功后合并购物车" note="普通注册或 Pro 注册均 mergeGuestCart" />
                  <UmlArrow />
                  <UmlAction title="用 copyCart 转真实 quote" note="保持点击 checkout 当下的 checked/coupon 语义" />
                  <UmlArrow />
                  <UmlStartEnd label="进入 checkout?id" end />
                </UmlBranch>
              </Stack>
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["路径", "代码位置", "业务规则"]} rows={anonymousCheckoutRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：登录用户合并购物车</H2>
        <Card>
          <CardHeader>Login / Register 后合并匿名购物车</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="登录/注册成功" />
              <UmlArrow />
              <UmlAction title="handleUserAction" note="mergeCart=true，覆盖登录、注册、Pro 注册、社交登录等入口" />
              <UmlArrow />
              <UmlDecision title="是否 checkout 入口？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="是">
                  <UmlAction title="copyCartData" note="登录/注册前已保存匿名 cart.items 与 coupon_code" />
                  <UmlArrow />
                  <UmlAction title="后续本次结账使用 copyCart" note="converseShoppingCartToQuote('checkout') 传 customize_quote" />
                </UmlBranch>
                <UmlBranch label="否">
                  <UmlAction title="不生成结账快照" note="普通登录/注册只处理购物车合并和页面跳转" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="mergeGuestCart" note="先清理匿名 Buy Now cart id 和 buyNowCartData" />
              <UmlArrow />
              <UmlDecision title="匿名 cart.items 是否为空？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="为空">
                  <UmlAction title="loadCart" note="不调用合并接口，直接加载登录用户远程购物车" />
                </UmlBranch>
                <UmlBranch label="有条目">
                  <UmlAction title="mergeCart" note="调用 mergeShoppingCartShoppingCart" />
                  <UmlArrow />
                  <UmlAction title="格式化匿名条目" note="clone + reverse；getFormattedCartItemsForParams；qty 缺失补 1 并记录日志" />
                  <UmlArrow />
                  <UmlAction title="携带 coupon_code" note="input.items + input.coupon_code" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="合并接口结果？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="成功">
                  <UmlAction title="updateCartData" note="items / coupon / prices / country / checked_totals / shipping_method / cart_errors" />
                </UmlBranch>
                <UmlBranch label="失败">
                  <UmlAction title="clearCartData + 记录 Sentry" note="errors 或 success=false；写入 error.mergeCart" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlAction title="loadTotalQty" note="刷新 header/cart icon 全量数量" />
              <UmlArrow />
              <UmlDecision title="是否 checkout 入口？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="是">
                  <UmlAction title="afterLogin / afterRegister" note="Cart.vue handleAction -> goToCheckout('checkout')" />
                  <UmlArrow />
                  <UmlStartEnd label="用 copyCart 进入 checkout?id" end />
                </UmlBranch>
                <UmlBranch label="否">
                  <UmlAction title="继续后续行为" note="收藏续加、GTM、redirectTo 或关闭弹窗" />
                  <UmlArrow />
                  <UmlStartEnd label="停留或跳转目标页" end />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["环节", "代码位置", "规则"]} rows={mergeCartRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：Go to Checkout 转 Quote</H2>
        <Card>
          <CardHeader>真实 Quote 与虚拟 Quote 分流</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="点击 checkout" />
              <UmlArrow />
              <UmlDecision title="是否登录？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="登录用户">
                  <UmlAction title="调用 converseShoppingCartToQuote" note="真实购物车转真实 quote，成功返回 quoteId" />
                  <UmlArrow />
                  <UmlDecision title="接口是否成功？" />
                  <Grid columns={2} gap={12}>
                    <UmlBranch label="成功">
                      <UmlAction title="更新 quoteStore" note="id、applied_coupons、cart_errors" />
                      <UmlArrow />
                      <UmlStartEnd label="checkout?id" end />
                    </UmlBranch>
                    <UmlBranch label="CART_VALID_ITEM_EMPTY">
                      <UmlAction title="刷新当前购物车" note="load() + loadTotalQty()" />
                      <UmlArrow />
                      <UmlStartEnd label="留在 cart" end />
                    </UmlBranch>
                    <UmlBranch label="CART_AUTHORIZATION_FAILED">
                      <UmlAction title="回退匿名 quote" note="getAnonymousQuoteData 写入 quoteStore" />
                      <UmlArrow />
                      <UmlStartEnd label="checkout" end />
                    </UmlBranch>
                  </Grid>
                </UmlBranch>
                <UmlBranch label="匿名用户">
                  <UmlAction title="创建虚拟 quote" note="getAnonymousQuoteData：只取 checked 条目" />
                  <UmlArrow />
                  <UmlAction title="写入 quoteStore" note="items、shipping_addresses、applied_coupons、prices" />
                  <UmlArrow />
                  <UmlStartEnd label="checkout" end />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["场景", "代码位置", "业务规则"]} rows={goToCheckoutRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>购物车页规则对照</H2>
        <Table headers={["模块", "文件/函数", "职责"]} rows={cartOperationRows} striped />
        <Divider />
        <Table headers={["用户/位置", "展示项", "规则"]} rows={cartPriceRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>UML Activity：登录态授权失效降级</H2>
        <Card>
          <CardHeader>CART_AUTHORIZATION_FAILED Fallback</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="登录态操作" />
              <UmlArrow />
              <UmlAction title="调用登录购物车接口" note="优惠券、配送国家、转 quote、勾选等真实购物车 API" />
              <UmlArrow />
              <UmlDecision title="是否返回授权失败？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="否">
                  <UmlAction title="正常刷新真实购物车" note="updateCartData 写入 items/prices/checked_totals/shipping/coupon" />
                  <UmlArrow />
                  <UmlStartEnd label="完成" end />
                </UmlBranch>
                <UmlBranch label="是：CART_AUTHORIZATION_FAILED">
                  <UmlDecision title="失败操作类型？" />
                  <Stack gap={10}>
                    <UmlBranch label="优惠券">
                      <UmlAction title="回退匿名优惠券逻辑" note="applyCouponForVirtualCart / removeCouponForVirtualCart" />
                    </UmlBranch>
                    <UmlBranch label="配送国家">
                      <UmlAction title="回退匿名运费逻辑" note="setShippingCountryCodeForVirtual" />
                    </UmlBranch>
                    <UmlBranch label="转 quote">
                      <UmlAction title="回退虚拟 quote" note="getAnonymousQuoteData 写 quoteStore，然后跳 checkout" />
                    </UmlBranch>
                    <UmlBranch label="勾选/取消勾选">
                      <UmlAction title="静默结束" note="checking/unchecking 捕获授权失败后直接 return" />
                    </UmlBranch>
                  </Stack>
                  <UmlArrow />
                  <UmlStartEnd label="按匿名路径继续" end />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["场景", "登录函数", "降级规则"]} rows={authFallbackRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>优惠券失效首次提示</H2>
        <Card>
          <CardHeader>本地持久化驱动的一次性错误提示</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <UmlStartEnd label="进入 Cart" />
              <UmlArrow />
              <UmlAction title="从 vsf-cart 恢复状态" note="包含 cartCouponError.coupon_code / cartCouponError.cart_errors" />
              <UmlArrow />
              <UmlDecision title="是否登录？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="登录用户">
                  <UmlAction title="previewShoppingCart" note="真实购物车预览，接口返回 coupon_code / cart_errors" />
                  <UmlArrow />
                  <UmlAction title="手动应用时" note="setShoppingCartCouponCode / removeShoppingCartCouponCode" />
                </UmlBranch>
                <UmlBranch label="匿名用户">
                  <UmlAction title="previewAnonymousShoppingCart" note="传入 cart_items + country_code + coupon_code" />
                  <UmlArrow />
                  <UmlAction title="手动应用时" note="setAnonymousShoppingCartCouponCode；移除时重新 previewAnonymousShoppingCart" />
                </UmlBranch>
              </Grid>
              <UmlArrow />
              <UmlDecision title="接口是否返回 coupon 错误？" />
              <Grid columns={2} gap={16}>
                <UmlBranch label="是">
                  <UmlAction title="写入 cartCouponError" note="updateCartData 同步 coupon_code 与 cart_errors" />
                  <UmlArrow />
                  <UmlAction title="CartCouponCode 展示错误" note="watch immediate 命中 type=coupon" />
                  <UmlArrow />
                  <UmlAction title="清理本地 coupon 上下文" note="resetCartCoupon + resetCartErrors + resetCoupon" />
                  <UmlArrow />
                  <UmlStartEnd label="首次提示结束" end />
                </UmlBranch>
                <UmlBranch label="否">
                  <UmlAction title="不展示失效错误" note="没有本地 coupon 错误上下文，视为第二次或后续访问" />
                  <UmlArrow />
                  <UmlStartEnd label="正常展示" end />
                </UmlBranch>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
        <Table headers={["环节", "代码位置", "规则"]} rows={couponInvalidRows} striped />
      </Stack>

      <Stack gap={10}>
        <H2>可优化点</H2>
        <Card>
          <CardHeader>后续架构改进方向</CardHeader>
          <CardBody>
            <Text>
              以下内容是暂定优化方向，不属于当前已确认业务流程。目标是减少购物车域里“登录/匿名双实现”和“条目结构多层适配”带来的维护成本。
            </Text>
          </CardBody>
        </Card>
        <Table headers={["方向", "当前问题", "期望结果"]} rows={optimizationRows} striped />
      </Stack>
    </Stack>
  );
}
