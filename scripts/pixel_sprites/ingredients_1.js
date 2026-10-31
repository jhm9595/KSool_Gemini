module.exports = [
  // ---------------------------------------------------------------------------
  // 1. ALCOHOL (주류: 101~105)
  // ---------------------------------------------------------------------------
  {
    key: 'soju',
    id: 101,
    name: '소주',
    aliases: [101, '101', 'ing_101', 'rec_5', '소주'],
    palette: {
      '.': null,
      'S': '#cbd5e1', // 은색 뚜껑
      'G': '#16a34a', // 초록 병
      'H': '#4ade80', // 하이라이트
      'D': '#14532d', // 그림자
      'W': '#ffffff', // 라벨 흰색
      'B': '#38bdf8'  // 라벨 파란 글씨
    },
    rows: [
      "....SSSS....",
      "....GGGG....",
      "...GGGGGG...",
      "..GHGGGGGD..",
      "..GHWWWWGD..",
      "..GHWBBWGD..",
      "..GHWWWWGD..",
      "..GHGGGGGD..",
      "..GHGGGGGD..",
      "..GHGGGGGD..",
      "..GHGGGGGD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'beer',
    id: 102,
    name: '맥주',
    aliases: [102, '102', 'ing_102', 'rec_4', '맥주'],
    palette: {
      '.': null,
      'Y': '#facc15', // 황금 캡
      'B': '#b45309', // 갈색 맥주병 본체
      'H': '#d97706', // 하이라이트
      'D': '#78350f', // 그림자
      'W': '#ffffff', // 라벨
      'R': '#ef4444'  // 라벨 레드 로고
    },
    rows: [
      "....YYYY....",
      "....BBBB....",
      "...BBBBBB...",
      "..BHBBBBBD..",
      "..BHWWWWBD..",
      "..BHWWRWBD..",
      "..BHWWWWBD..",
      "..BHBBBBBD..",
      "..BHBBBBBD..",
      "..BHBBBBBD..",
      "..BHBBBBBD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'bokbunjaju',
    id: 103,
    name: '복분자주',
    aliases: [103, '103', 'ing_103', 'rec_57', '복분자주'],
    palette: {
      '.': null,
      'G': '#eab308', // 금색 뚜껑
      'K': '#450a0a', // 검붉은 도자기병
      'H': '#7f1d1d', // 어두운 루비 하이라이트
      'D': '#2a0606', // 어두운 그림자
      'R': '#dc2626', // 붉은색 띠/라벨
      'W': '#fef08a'  // 금빛 글씨
    },
    rows: [
      "....GGGG....",
      "....KKKK....",
      "...KKKKKK...",
      "..HKKKKKKD..",
      "..HKRRRRKD..",
      "..HKRWWRKD..",
      "..HKRRRRKD..",
      "..HKKKKKKD..",
      "..HKKKKKKD..",
      "..HKKKKKKD..",
      "..HKKKKKKD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'maesilju',
    id: 104,
    name: '매실주',
    aliases: [104, '104', 'ing_104', 'rec_20', '매실주', '매화수'],
    palette: {
      '.': null,
      'C': '#ca8a04', // 뚜껑
      'A': '#fef08a', // 맑은 황금빛 매실주
      'H': '#ffffff', // 유리 반사광
      'D': '#eab308', // 액체 음영
      'M': '#65a30d', // 초록 매실 열매
      'L': '#84cc16'  // 매실 밝은 면
    },
    rows: [
      "....CCCC....",
      "....AAAA....",
      "...AAAAAA...",
      "..HAAAAAAD..",
      "..HAAAAAAD..",
      "..HAA..AAD..",
      "..HA.LLMAD..",
      "..HA.MMMAD..",
      "..HAA..AAD..",
      "..HAAAAAAD..",
      "..HAAAAAAD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'makgeolli',
    id: 105,
    name: '막걸리',
    aliases: [105, '105', 'ing_105', 'rec_26', '막걸리'],
    palette: {
      '.': null,
      'C': '#16a34a', // 초록 캡
      'W': '#f8fafc', // 뽀얀 막걸리병 본체
      'H': '#ffffff', // 하이라이트
      'S': '#e2e8f0', // 그림자
      'Y': '#fef08a', // 노란 전통 라벨
      'G': '#15803d'  // 라벨 초록 글씨
    },
    rows: [
      "....CCCC....",
      "....WWWW....",
      "...WWWWWW...",
      "..HWWWWWWS..",
      "..HWYYYYWS..",
      "..HWYGGYWS..",
      "..HWYYYYWS..",
      "..HWWWWWWS..",
      "..HWWWWWWS..",
      "..HWWWWWWS..",
      "..HWWWWWWS..",
      "...SSSSSS..."
    ]
  },

  // ---------------------------------------------------------------------------
  // 2. NATURE / ELEMENTS (자연: 201~206)
  // ---------------------------------------------------------------------------
  {
    key: 'ice',
    id: 201,
    name: '얼음',
    aliases: [201, '201', 'ing_201', 'rec_11', '얼음'],
    palette: {
      '.': null,
      'W': '#ffffff', // 하이라이트
      'C': '#bae6fd', // 밝은 얼음 청록
      'M': '#38bdf8', // 중간 블루
      'D': '#0284c7'  // 그림자
    },
    rows: [
      "....WWWW....",
      "...WCCCCW...",
      "..WCCCCCCW..",
      "..WCCCCMCW..",
      ".WCCCCCCCCD.",
      ".WCCCCMMCCD.",
      ".WCCMMMMCCD.",
      ".WCMMDMDCCD.",
      ".WCDDDDDDDD.",
      "..DDDDDDDD..",
      "...DDDDDD...",
      "....DDDD...."
    ]
  },
  {
    key: 'water',
    id: 202,
    name: '물',
    aliases: [202, '202', 'ing_202', '물'],
    palette: {
      '.': null,
      'W': '#ffffff', // 물방울 하이라이트
      'L': '#7dd3fc', // 맑은 하늘빛
      'M': '#0ea5e9', // 푸른 물빛
      'D': '#0369a1'  // 짙은 물 그림자
    },
    rows: [
      ".....W......",
      "....WLW.....",
      "....WLL.....",
      "...WLLLM....",
      "...WLLMMM...",
      "..WLLMMMMD..",
      "..WLLMMMMD..",
      ".WLLMMMMMMD.",
      ".WLLMMMMMMD.",
      "..WLMMMMMD..",
      "...DMMMMD...",
      "....DDDD...."
    ]
  },
  {
    key: 'fire',
    id: 203,
    name: '불',
    aliases: [203, '203', 'ing_203', '불'],
    palette: {
      '.': null,
      'W': '#ffffff', // 불꽃 중심 백열광
      'Y': '#fde047', // 노란 불꽃
      'O': '#fb923c', // 주황 불꽃
      'R': '#ef4444', // 빨간 불꽃
      'D': '#991b1b'  // 짙은 레드
    },
    rows: [
      "......Y.....",
      ".....YYY....",
      "....YYOY....",
      "....YOWY....",
      "...YOWWWY...",
      "..OOWWWWOO..",
      "..OOWWWWRO..",
      ".ROOWWWWRRD.",
      ".RROOWWRRRD.",
      ".RRRROORRRD.",
      "..RRRRRRRD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'sparkling_water',
    id: 204,
    name: '탄산수',
    aliases: [204, '204', 'ing_204', 'rec_12', '탄산수'],
    palette: {
      '.': null,
      'C': '#38bdf8', // 캡
      'B': '#e0f2fe', // 페트병 본체 투명
      'W': '#ffffff', // 탄산 기포
      'D': '#94a3b8', // 그림자
      'T': '#0284c7'  // 탄산 파란 라벨
    },
    rows: [
      "....CCCC....",
      "....BBBB....",
      "...BBBBBB...",
      "..HBBBBBBD..",
      "..HTTTTTTD..",
      "..HTWWTWTD..",
      "..HTTTTTTD..",
      "..HB.W.BBD..",
      "..HBB.W.BD..",
      "..HB.W.BBD..",
      "..HBBBBBBD..",
      "...DDDDDD..."
    ].map(r => r.replace(/H/g, 'W'))
  },
  {
    key: 'air',
    id: 205,
    name: '공기',
    aliases: [205, '205', 'ing_205', '공기'],
    palette: {
      '.': null,
      'W': '#ffffff', // 흰색 바람선
      'L': '#bae6fd', // 연한 하늘색 기류
      'M': '#7dd3fc'  // 바람 소용돌이
    },
    rows: [
      "....WWWW....",
      "..WWLLLLWW..",
      ".WLL....LLW.",
      ".WL..WW..LW.",
      "....WLLW....",
      "...WLLLLW...",
      "..WLL..LLW..",
      ".WLL....LLW.",
      ".WL..WW..LW.",
      "....WLLW....",
      ".....WW.....",
      "............"
    ]
  },
  {
    key: 'snow',
    id: 206,
    name: '눈',
    aliases: [206, '206', 'ing_206', '눈'],
    palette: {
      '.': null,
      'W': '#ffffff', // 눈송이
      'C': '#e0f2fe', // 결정 그림자
      'S': '#93c5fd'  // 배경 외곽
    },
    rows: [
      ".....WW.....",
      "..W..WW..W..",
      "...W.WW.W...",
      "....WWWW....",
      ".WWWWWWWWWW.",
      ".WWWWWWWWWW.",
      "....WWWW....",
      "...W.WW.W...",
      "..W..WW..W..",
      ".....WW.....",
      "....CCCC....",
      "............"
    ]
  },

  // ---------------------------------------------------------------------------
  // 3. FRUIT (과일: 301~315)
  // ---------------------------------------------------------------------------
  {
    key: 'lemon',
    id: 301,
    name: '레몬',
    aliases: [301, '301', 'ing_301', '레몬'],
    palette: {
      '.': null,
      'G': '#65a30d', // 꼭지 잎
      'H': '#fef08a', // 레몬 밝은 면
      'Y': '#facc15', // 레몬 본체
      'D': '#ca8a04'  // 그림자
    },
    rows: [
      "......G.....",
      "....YYYY....",
      "...HYYYYY...",
      "..HYYYYYYD..",
      ".HYYYYYYYYD.",
      ".HYYYYYYYYD.",
      ".HYYYYYYYYD.",
      "..HYYYYYYD..",
      "...HYYYYD...",
      "....YYDD....",
      ".....DD.....",
      "............"
    ]
  },
  {
    key: 'melon',
    id: 302,
    name: '멜론',
    aliases: [302, '302', 'ing_302', '멜론'],
    palette: {
      '.': null,
      'T': '#4d7c0f', // 꼭지 줄기
      'G': '#84cc16', // 멜론 껍질 연두
      'N': '#f7fee7', // 그물 무늬 (네트)
      'D': '#3f6212'  // 그림자
    },
    rows: [
      "....TTT.....",
      ".....T......",
      "...GGGGGG...",
      "..GNGGNGGGD.",
      ".GNGNNGNNGGD",
      ".GGNGGNGGGGD",
      ".GNNGNNGNNGD",
      ".GGNGGNGGGGD",
      "..GNNGNNGGD.",
      "...GGNGGGD..",
      "....DDDDD...",
      "............"
    ]
  },
  {
    key: 'mango',
    id: 303,
    name: '망고',
    aliases: [303, '303', 'ing_303', '망고'],
    palette: {
      '.': null,
      'G': '#4d7c0f', // 꼭지
      'R': '#f87171', // 붉은 뺨
      'Y': '#fbbf24', // 망고 옐로우
      'H': '#fef08a', // 하이라이트
      'D': '#d97706'  // 그림자
    },
    rows: [
      ".....G......",
      "....YYYY....",
      "...RYYYYY...",
      "..RRYYYYYD..",
      ".RRYYYYYYYD.",
      ".RYYYYYYYYD.",
      ".RYHYYYYYYD.",
      "..YYYYYYYD..",
      "...YYYYYDD..",
      "....YYDD....",
      ".....DD.....",
      "............"
    ]
  },
  {
    key: 'maesil',
    id: 304,
    name: '매실',
    aliases: [304, '304', 'ing_304', '매실'],
    palette: {
      '.': null,
      'T': '#4d7c0f', // 줄기 꼭지
      'H': '#bef264', // 하이라이트
      'G': '#65a30d', // 초록 매실
      'D': '#3f6212'  // 골 그림자
    },
    rows: [
      ".....T......",
      "....GGGG....",
      "...HGGGGGD..",
      "..HHGGGGDDD.",
      "..HHGG.GDDD.",
      "..HHGG.GDDD.",
      "..HHGGGGDDD.",
      "..HHGGGGDDD.",
      "...HGGGGDD..",
      "....GGDD....",
      ".....DD.....",
      "............"
    ]
  },
  {
    key: 'tomato',
    id: 305,
    name: '토마토',
    aliases: [305, '305', 'ing_305', '토마토'],
    palette: {
      '.': null,
      'G': '#16a34a', // 별모양 초록 꼭지
      'H': '#f87171', // 하이라이트
      'R': '#ef4444', // 빨간 토마토
      'D': '#991b1b'  // 그림자
    },
    rows: [
      "....G.G.....",
      "....GGGG....",
      "...HRRRRR...",
      "..HHRRRRRD..",
      ".HHRRRRRRRD.",
      ".HHRRRRRRRD.",
      ".HHRRRRRRRD.",
      "..HRRRRRRDD.",
      "...HRRRRDD..",
      "....RRDD....",
      ".....DD.....",
      "............"
    ]
  },
  {
    key: 'apple',
    id: 306,
    name: '사과',
    aliases: [306, '306', 'ing_306', '사과'],
    palette: {
      '.': null,
      'T': '#78350f', // 나뭇가지 꼭지
      'L': '#84cc16', // 초록 잎사귀
      'H': '#fca5a5', // 하이라이트
      'R': '#dc2626', // 빨간 사과
      'D': '#7f1d1d'  // 그림자
    },
    rows: [
      ".....TL.....",
      "....TRLL....",
      "...RR.RRR...",
      "..HRRRRRRD..",
      ".HHRRRRRRRD.",
      ".HHRRRRRRRD.",
      ".HHRRRRRRRD.",
      "..HRRRRRRDD.",
      "...HRRRRDD..",
      "....RRDD....",
      ".....DD.....",
      "............"
    ]
  },
  {
    key: 'strawberry',
    id: 307,
    name: '딸기',
    aliases: [307, '307', 'ing_307', '딸기'],
    palette: {
      '.': null,
      'G': '#22c55e', // 딸기 꼭지 잎
      'R': '#ef4444', // 딸기 과육 레드
      'Y': '#fef08a', // 딸기 씨앗
      'D': '#991b1b'  // 그림자
    },
    rows: [
      "....GGGG....",
      "...GGGGGG...",
      "..RRRRRRRR..",
      "..RYRRYRRD..",
      ".RRRYRRRYRD.",
      ".RRYRRRYRRD.",
      "..RYRRYRRD..",
      "..RRRYRRRD..",
      "...RYRRRD...",
      "....RRDD....",
      ".....DD.....",
      "............"
    ]
  },
  {
    key: 'cacao',
    id: 308,
    name: '카카오',
    aliases: [308, '308', 'ing_308', '카카오'],
    palette: {
      '.': null,
      'G': '#65a30d', // 꼭지
      'B': '#78350f', // 카카오 열매 갈색
      'H': '#b45309', // 능선 밝은면
      'D': '#451a03'  // 골 그림자
    },
    rows: [
      ".....G......",
      "....BBBB....",
      "...HBBBBBD..",
      "..HHBHBHBDD.",
      ".HHHBHBHBDDD",
      ".HHHBHBHBDDD",
      ".HHHBHBHBDDD",
      "..HHBHBHBDD.",
      "...HBBBBBD..",
      "....BBDD....",
      ".....DD.....",
      "............"
    ]
  },
  {
    key: 'pear',
    id: 309,
    name: '배',
    aliases: [309, '309', 'ing_309', '배'],
    palette: {
      '.': null,
      'T': '#78350f', // 나뭇가지
      'H': '#fef3c7', // 하이라이트
      'P': '#fde68a', // 노르스름한 배 껍질
      'D': '#d97706'  // 그림자
    },
    rows: [
      ".....T......",
      "....PPPP....",
      "...HPPPPPD..",
      "..HHPPPPPPD.",
      ".HHPPPPPPPPD",
      ".HHPPPPPPPPD",
      ".HHPPPPPPPPD",
      "..HPPPPPPPD.",
      "...HPPPPPD..",
      "....PPDD....",
      ".....DD.....",
      "............"
    ]
  },
  {
    key: 'banana',
    id: 310,
    name: '바나나',
    aliases: [310, '310', 'ing_310', '바나나'],
    palette: {
      '.': null,
      'G': '#65a30d', // 꼭지 초록
      'H': '#fef08a', // 하이라이트
      'Y': '#facc15', // 바나나 노랑
      'D': '#ca8a04', // 그림자
      'K': '#78350f'  // 밑동 갈색
    },
    rows: [
      ".......GG...",
      "......YYYY..",
      ".....HYYYD..",
      "....HYYYD...",
      "...HYYYD....",
      "..HYYYD.....",
      "..HYYYD.....",
      ".HYYYD......",
      ".HYYD.......",
      "..YD........",
      "...K........",
      "............"
    ]
  },
  {
    key: 'yuzu',
    id: 311,
    name: '유자',
    aliases: [311, '311', 'ing_311', '유자'],
    palette: {
      '.': null,
      'G': '#4d7c0f', // 꼭지
      'H': '#fef08a', // 울퉁불퉁 껍질 하이라이트
      'Y': '#eab308', // 유자 짙은 옐로우
      'D': '#a16207'  // 그림자
    },
    rows: [
      ".....G......",
      "....YYYY....",
      "...HYHYYYD..",
      "..HYYYYYYYD.",
      ".HYHYYYYYYHD",
      ".HYYYYYYYYHD",
      ".HYHYYYYYYHD",
      "..HYYYYYYDD.",
      "...HYHYYDD..",
      "....YYDD....",
      ".....DD.....",
      "............"
    ]
  },
  {
    key: 'calamansi',
    id: 312,
    name: '깔라만시',
    aliases: [312, '312', 'ing_312', '깔라만시'],
    palette: {
      '.': null,
      'G': '#15803d', // 꼭지
      'L': '#84cc16', // 연두색 껍질
      'Y': '#facc15', // 단면 과육 노랑
      'H': '#fef08a', // 속살 하이라이트
      'D': '#4d7c0f'  // 껍질 그림자
    },
    rows: [
      ".....G......",
      "....LLLL....",
      "...HYYYYLD..",
      "..HYHYHYYLD.",
      ".HYYYYYYYYLD",
      ".LYYYYYYYYLD",
      ".LYHYHYYYYLD",
      "..LYYYYYYLD.",
      "...LLLLLLD..",
      "....DDDD....",
      "............",
      "............"
    ]
  },
  {
    key: 'bokbunja',
    id: 313,
    name: '복분자',
    aliases: [313, '313', 'ing_313', '복분자'],
    palette: {
      '.': null,
      'G': '#16a34a', // 꼭지 잎
      'P': '#831843', // 짙은 복분자 보라
      'R': '#be123c', // 알갱이 루비
      'K': '#4a044e'  // 그림자 딥 블랙베리
    },
    rows: [
      "....G.G.....",
      "....GPPG....",
      "...PRPKP....",
      "..PRPKPPR...",
      ".PRPKPPRPK..",
      ".PRPKPPRPK..",
      ".PRPKPPRPK..",
      "..PRPKPPR...",
      "...PRPKP....",
      "....KKKK....",
      "............",
      "............"
    ]
  },
  {
    key: 'pomegranate',
    id: 314,
    name: '석류',
    aliases: [314, '314', 'ing_314', '석류'],
    palette: {
      '.': null,
      'C': '#991b1b', // 왕관 꼭지
      'H': '#f87171', // 하이라이트
      'R': '#dc2626', // 껍질 붉은색
      'K': '#f43f5e', // 속살 핑크
      'S': '#ffffff', // 알갱이 빛
      'D': '#7f1d1d'  // 그림자
    },
    rows: [
      "....C.C.....",
      ".....C......",
      "...RRRRRR...",
      "..HRRRRRRD..",
      ".HRRKKKRRRD.",
      ".HRKSKSKRRD.",
      ".HRKKKKKRRD.",
      ".HRRKKKRRRD.",
      "..HRRRRRRDD.",
      "...HRRRRDD..",
      "....DDDD....",
      "............"
    ]
  },
  {
    key: 'orange',
    id: 315,
    name: '오렌지',
    aliases: [315, '315', 'ing_315', '오렌지'],
    palette: {
      '.': null,
      'G': '#15803d', // 꼭지
      'H': '#fdba74', // 하이라이트
      'O': '#f97316', // 오렌지 주황
      'D': '#c2410c'  // 그림자
    },
    rows: [
      ".....G......",
      "....OOOO....",
      "...HOOOOOD..",
      "..HHOOOOODD.",
      ".HHHOOOOOODD",
      ".HHHOOOOOODD",
      ".HHHOOOOOODD",
      "..HHOOOOODD.",
      "...HOOOOOD..",
      "....OODD....",
      ".....DD.....",
      "............"
    ]
  }
];
