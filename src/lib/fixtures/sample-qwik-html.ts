export const QWIK_CONTAINER_HTML = `
<html q:container="paused" q:version="1.9.0" q:render="ssr" q:base="/build/" q:manifest-hash="abc123">
  <body>
    <div q:id="0" q:key="sA_0">
      <h1 q:id="1">Hello</h1>
      <div q:id="2" q:key="counter_1">
        <button q:id="3" on:click="./chunk-abc.js#Counter_onClick[0 1]">
          Count: 0
        </button>
      </div>
    </div>
    <!--qv q:id=4 q:key=layout_0-->
    <main q:id="5">
      <p q:id="6">Content here</p>
    </main>
    <!--/qv-->
    <script type="qwik/json">{"refs":{"0":"0","3":"1 2"},"ctx":{"0":{"w":"./chunk-def.js#App_component"}},"objs":["hello","\\u00120","./chunk-abc.js#Counter_onClick",42,true,null,["a","b"],{"key":"value"}],"subs":[["2 #0 1 #3 data"]]}</script>
  </body>
</html>
`;

export const NO_QWIK_HTML = `
<html>
  <body>
    <div>
      <h1>Regular page</h1>
    </div>
  </body>
</html>
`;

export const MULTIPLE_CONTAINERS_HTML = `
<html q:container="resumed" q:version="2.0.0" q:render="dom">
  <body>
    <div q:container="paused" q:version="1.9.0" q:render="ssr">
      <span q:id="0">Widget</span>
    </div>
  </body>
</html>
`;

/**
 * Sibling virtual nodes separated by <!--/qv--> closing comments,
 * followed by a regular element. Regression test for the bug where
 * elements after <!--/qv--> were incorrectly nested inside the
 * preceding virtual node.
 */
export const SIBLING_VIRTUAL_NODES_HTML = `
<html q:container="paused" q:version="1.9.0" q:render="ssr">
  <body>
    <!--qv q:id=1 q:key=HeaderComp_0-->
    <header q:id="2"><nav q:id="3">links</nav></header>
    <!--/qv-->
    <!--qv q:id=4 q:key=MainComp_0-->
    <main q:id="5"><p q:id="6">content</p></main>
    <!--/qv-->
    <footer q:id="7">foot</footer>
  </body>
</html>
`;

/**
 * Elements with Qwik event handlers or q:key but no q:id.
 * Regression test for isQwikElement detection of client-rendered
 * elements where q:id may be absent.
 */
export const NO_QID_QWIK_ELEMENTS_HTML = `
<html q:container="resumed" q:version="1.9.0" q:render="ssr">
  <body>
    <div q:id="0">
      <button on:click="./chunk.js#DocSearch_onClick[0]">Click</button>
      <span q:key="myKey_0">keyed</span>
      <p>plain paragraph</p>
    </div>
  </body>
</html>
`;

/**
 * Variant with a prod-mode QRL (s_abc123) for name extraction testing.
 */
export const PROD_QRL_ELEMENT_HTML = `
<html q:container="resumed" q:version="1.9.0" q:render="ssr">
  <body>
    <div q:id="0">
      <button on:click="./chunk.js#s_abc123[0]">Click</button>
    </div>
  </body>
</html>
`;
