export const BASIC_STATE_JSON = JSON.stringify({
  refs: {
    '0': '0',
    '3': '1 2',
  },
  ctx: {
    '0': {
      w: './chunk-def.js#App_component',
      s: { count: 0 },
      i: [],
    },
  },
  objs: [
    'hello', // 0: string
    '\u00120', // 1: signal pointing to obj 0
    './chunk-abc.js#Counter_onClick', // 2: plain string (not QRL prefix)
    42, // 3: number
    true, // 4: boolean
    null, // 5: null
    ['a', 'b'], // 6: array
    { key: 'value' }, // 7: object
    '\u00113@4', // 8: computed: valueIndex=3, funcIndex=4
    '\u0002./chunk.js#sym[0 1]', // 9: QRL with captures
    '#5', // 10: element ref
    '*7', // 11: text ref
  ],
  subs: [['2 #0 1 #3 data']],
});

export const EMPTY_STATE_JSON = JSON.stringify({
  refs: {},
  ctx: {},
  objs: [],
  subs: [],
});

export const MALFORMED_JSON = '{invalid json here}}}';
