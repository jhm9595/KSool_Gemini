module.exports = [
  // ---------------------------------------------------------------------------
  // 4. DAIRY & GRAINS (유제품 및 곡류: 401, 501~504)
  // ---------------------------------------------------------------------------
  {
    key: 'milk',
    id: 401,
    name: '우유',
    aliases: [401, '401', 'ing_401', '우유'],
    palette: {
      '.': null,
      'W': '#ffffff', // 우유팩 상단
      'G': '#16a34a', // 서울우유 녹색 삼각 무늬
      'D': '#cbd5e1', // 팩 음영
      'S': '#94a3b8'  // 그림자
    },
    rows: [
      "....WWWW....",
      "...WWWWWW...",
      "..WWWWWWWW..",
      "..WGGGGGGW..",
      "..WGGGGGGW..",
      "..WWWWWWWW..",
      "..WWWWWWWW..",
      "..WWWWWWWW..",
      "..WWWWWWWW..",
      "..WWWWWWWWD.",
      "..WWWWWWWWD.",
      "...SSSSSS..."
    ]
  },
  {
    key: 'barley',
    id: 501,
    name: '맥(보리)',
    aliases: [501, '501', 'ing_501', '맥(보리)', '맥', '보리'],
    palette: {
      '.': null,
      'S': '#ca8a04', // 수염 / 까락
      'H': '#fef08a', // 밝은 낟알
      'B': '#eab308', // 보리 낟알
      'D': '#a16207'  // 줄기 및 그림자
    },
    rows: [
      "..S....S....",
      "...S..S.....",
      "....HB......",
      "...HBDH.....",
      "....HBD.....",
      "...HBDH.....",
      "....HBD.....",
      "...HBDH.....",
      "....HDD.....",
      ".....D......",
      ".....D......",
      ".....D......"
    ]
  },
  {
    key: 'rice',
    id: 502,
    name: '쌀',
    aliases: [502, '502', 'ing_502', '쌀'],
    palette: {
      '.': null,
      'W': '#ffffff', // 고봉밥 흰 쌀
      'S': '#f1f5f9', // 쌀알 음영
      'B': '#3b82f6', // 도자기 밥그릇 파랑
      'D': '#1d4ed8', // 그릇 음영
      'R': '#e2e8f0'  // 그릇 굽
    },
    rows: [
      ".....WW.....",
      "....WWWW....",
      "...WWWWWW...",
      "..WWWSWWWW..",
      ".WWWSWWWSWW.",
      "BBBBBBBBBBBB",
      "BBBBBBBBBBBB",
      ".BBBBBBBBBBD",
      "..BBBBBBBBD.",
      "...BBBBBDD..",
      "....RRRR....",
      "............"
    ]
  },
  {
    key: 'misutgaru',
    id: 503,
    name: '미숫가루',
    aliases: [503, '503', 'ing_503', 'rec_61', '미숫가루'],
    palette: {
      '.': null,
      'P': '#d97706', // 숟가락 손잡이 갈색
      'H': '#fde68a', // 미숫가루 연노랑 분말
      'B': '#d4a373', // 곡물가루 토스티 베이지
      'C': '#b45309', // 도자기 사발 테두리
      'D': '#78350f'  // 그릇 바닥
    },
    rows: [
      "........P...",
      ".......P....",
      "....CCCCCC..",
      "..CCHHHHBBCC",
      ".CHHHHHHBBBD",
      ".CHHHHHHBBBD",
      ".CHHHHHHBBBD",
      "..CHHHHBBBD.",
      "...CDDDDDC..",
      "....CDDDC...",
      ".....DDD....",
      "............"
    ]
  },
  {
    key: 'coffee_beans',
    id: 504,
    name: '커피콩',
    aliases: [504, '504', 'ing_504', '커피콩', '커피원두'],
    palette: {
      '.': null,
      'H': '#a16207', // 원두 하이라이트
      'B': '#713f12', // 원두 바디
      'C': '#451a03', // 센터 컷 (가운데 갈라진 홈)
      'D': '#1c1917'  // 어두운 그림자
    },
    rows: [
      "....HH......",
      "...HBBHD....",
      "..HBCBBD....",
      "..HBCBBD....",
      "...DCCD.....",
      "....DD..HH..",
      ".......HBBHD",
      "......HBCBBD",
      "......HBCBBD",
      ".......DCCD.",
      "........DD..",
      "............"
    ]
  },

  // ---------------------------------------------------------------------------
  // 5. DRINKS & SOFT DRINKS (음료류: 601~621)
  // ---------------------------------------------------------------------------
  {
    key: 'black_tea',
    id: 601,
    name: '홍차',
    aliases: [601, '601', 'ing_601', '홍차'],
    palette: {
      '.': null,
      'S': '#cbd5e1', // 은색 캔 뚜껑
      'R': '#dc2626', // 실론티 레드 캔
      'Y': '#facc15', // 실론 로고
      'D': '#991b1b'  // 그림자
    },
    rows: [
      "....SSSS....",
      "...SSSSSS...",
      "..SRRRRRRS..",
      "..SRRRRRRS..",
      "..SRRYYRRS..",
      "..SRYYYYRS..",
      "..SRRYYRRS..",
      "..SRRRRRRS..",
      "..SRRRRRRS..",
      "..SRRRRRRS..",
      "..SRRRRRRD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'energy_drink',
    id: 602,
    name: '에너지드링크',
    aliases: [602, '602', 'ing_602', '에너지드링크', '핫식스'],
    palette: {
      '.': null,
      'S': '#cbd5e1', // 캔 림
      'B': '#1e3a8a', // 핫식스 메탈릭 블루
      'O': '#f97316', // 불새/번개 오렌지
      'Y': '#fde047', // 번개 불꽃 옐로우
      'D': '#0f172a'  // 그림자
    },
    rows: [
      "....SSSS....",
      "...SSSSSS...",
      "..SBBBBBBS..",
      "..SBBBOBBS..",
      "..SBBBOYBS..",
      "..SBBOYYBS..",
      "..SBYYYBBS..",
      "..SBOYYBBS..",
      "..SBBOYBBS..",
      "..SBBBBBBS..",
      "..SBBBBBBD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'ion_drink',
    id: 603,
    name: '이온음료',
    aliases: [603, '603', 'ing_603', '이온음료', '포카리스웨트'],
    palette: {
      '.': null,
      'S': '#cbd5e1', // 은색 림
      'B': '#0284c7', // 포카리 시그니처 딥 시안
      'W': '#ffffff', // 시그니처 화이트 파도
      'D': '#0369a1'  // 그림자
    },
    rows: [
      "....SSSS....",
      "...SSSSSS...",
      "..SBBBBBBS..",
      "..SBBWWWBS..",
      "..SBWWBBBS..",
      "..SWWWBBBS..",
      "..SBBWWWBS..",
      "..SBBBWWBS..",
      "..SBBBBBBS..",
      "..SBBBBBBS..",
      "..SBBBBBBD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'milksoda',
    id: 604,
    name: '밀크소다',
    aliases: [604, '604', 'ing_604', 'rec_15', '밀크소다', '밀키스'],
    palette: {
      '.': null,
      'S': '#cbd5e1', // 은색 캔
      'L': '#38bdf8', // 밀키스 스카이블루
      'W': '#ffffff', // 밀키스 화이트 버블 & 별
      'D': '#0284c7'  // 그림자
    },
    rows: [
      "....SSSS....",
      "...SSSSSS...",
      "..SLLLLLLS..",
      "..SLWLLWLS..",
      "..SLLWWLLS..",
      "..SLWWWWLS..",
      "..SLLWWLLS..",
      "..SLWLLWLS..",
      "..SLLLLLLS..",
      "..SLLLLLLS..",
      "..SLLLLLLD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'blue_lemonade',
    id: 605,
    name: '블루레몬에이드',
    aliases: [605, '605', 'ing_605', 'rec_14', '블루레몬에이드'],
    palette: {
      '.': null,
      'S': '#cbd5e1', // 캔 림
      'C': '#06b6d4', // 청량한 네온 사이언 블루
      'Y': '#facc15', // 레몬 슬라이스 옐로우
      'W': '#ffffff', // 탄산 기포
      'D': '#0891b2'  // 그림자
    },
    rows: [
      "....SSSS....",
      "...SSSSSS...",
      "..SCCCCCC..",
      "..SCCWCCCS..",
      "..SCYYYYCS..",
      "..SCYWWYCS..",
      "..SCYYYYCS..",
      "..SCCWCCCS..",
      "..SCCCCCCS..",
      "..SCCCCCCS..",
      "..SCCCCCCD..",
      "...DDDDDD..."
    ].map(r => r.length === 11 ? r + '.' : r)
  },
  {
    key: 'cider',
    id: 606,
    name: '사이다',
    aliases: [606, '606', 'ing_606', 'rec_58', '사이다', '칠성사이다'],
    palette: {
      '.': null,
      'S': '#cbd5e1', // 캔 림
      'G': '#15803d', // 칠성사이다 초록
      'W': '#ffffff', // 칠성 백색 별 로고
      'D': '#14532d'  // 그림자
    },
    rows: [
      "....SSSS....",
      "...SSSSSS...",
      "..SGGGGGGS..",
      "..SGGWGGGS..",
      "..SGW.WGGS..",
      "..SWWWWWGS..",
      "..SGW.WGGS..",
      "..SGGWGGGS..",
      "..SGGGGGGS..",
      "..SGGGGGGS..",
      "..SGGGGGYD..".replace('Y', 'G'),
      "...DDDDDD..."
    ]
  },
  {
    key: 'cola',
    id: 607,
    name: '콜라',
    aliases: [607, '607', 'ing_607', '콜라', '코카콜라'],
    palette: {
      '.': null,
      'S': '#cbd5e1', // 캔 림
      'R': '#dc2626', // 코카콜라 시그니처 레드
      'W': '#ffffff', // 화이트 리본 웨이브
      'D': '#991b1b'  // 그림자
    },
    rows: [
      "....SSSS....",
      "...SSSSSS...",
      "..SRRRRRRS..",
      "..SRRRRRRS..",
      "..SRRWWWRS..",
      "..SRWWWRRS..",
      "..SRRWWWRS..",
      "..SRRRWRRS..",
      "..SRRRRRRS..",
      "..SRRRRRRS..",
      "..SRRRRRRD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'tomato_juice',
    id: 608,
    name: '토마토주스',
    aliases: [608, '608', 'ing_608', 'rec_22', '토마토주스'],
    palette: {
      '.': null,
      'S': '#cbd5e1', // 캔 림
      'R': '#b91c1c', // 짙은 토마토 레드
      'G': '#16a34a', // 꼭지 엠블럼 초록
      'W': '#ffffff', // 라벨 텍스트
      'D': '#7f1d1d'  // 그림자
    },
    rows: [
      "....SSSS....",
      "...SSSSSS...",
      "..SRRRRRRS..",
      "..SRRGGPRS..".replace('P', 'R'),
      "..SRRRRRRS..",
      "..SRWWWWRS..",
      "..SRWWWWRS..",
      "..SRRRRRRS..",
      "..SRRRRRRS..",
      "..SRRRRRRS..",
      "..SRRRRRRD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'choco_milk',
    id: 609,
    name: '초코우유',
    aliases: [609, '609', 'ing_609', 'rec_29', '초코우유', '초코에몽'],
    palette: {
      '.': null,
      'C': '#0284c7', // 초코에몽 시그니처 블루 상단팩
      'W': '#ffffff', // 흰색 로고
      'B': '#451a03', // 짙은 초콜릿 갈색
      'D': '#1e293b'  // 그림자
    },
    rows: [
      "....CCCC....",
      "...CCCCCC...",
      "..CCCCCCCC..",
      "..CCWWWWCC..",
      "..CCWWWWCC..",
      "..BBBBBBBB..",
      "..BBBBBBBB..",
      "..BBBBBBBB..",
      "..BBBBBBBB..",
      "..BBBBBBBBD.",
      "..BBBBBBBBD.",
      "...DDDDDD..."
    ]
  },
  {
    key: 'strawberry_milk',
    id: 610,
    name: '딸기우유',
    aliases: [610, '610', 'ing_610', 'rec_34', '딸기우유'],
    palette: {
      '.': null,
      'P': '#f472b6', // 딸기우유 핑크 상단팩
      'W': '#ffffff', // 팩 흰색
      'R': '#ef4444', // 딸기 그림
      'G': '#22c55e', // 딸기 잎
      'D': '#db2777'  // 그림자
    },
    rows: [
      "....PPPP....",
      "...PPPPPP...",
      "..PPPPPPPP..",
      "..PWWWWWWP..",
      "..PWWGWWWP..",
      "..PWWRRWWP..",
      "..PWWRRWWP..",
      "..PWWWWWWP..",
      "..PPPPPPPP..",
      "..PPPPPPPPD.",
      "..PPPPPPPPD.",
      "...DDDDDD..."
    ]
  },
  {
    key: 'banana_milk',
    id: 611,
    name: '바나나우유',
    aliases: [611, '611', 'ing_611', 'rec_35', '바나나우유', '단지우유'],
    palette: {
      '.': null,
      'G': '#16a34a', // 초록 호일 뚜껑 (빨대 꽂는 곳)
      'P': '#cbd5e1', // 뚜껑 테두리
      'Y': '#fef08a', // 뚱바 항아리 연노랑 본체
      'H': '#ffffff', // 하이라이트
      'D': '#eab308'  // 항아리 볼록한 그림자
    },
    rows: [
      ".....GG.....",
      "....PPPP....",
      "...HYYYYY...",
      "..HYYYYYYD..",
      ".HYYYYYYYYD.",
      ".HYYYYYYYYD.",
      ".HYYYYYYYYD.",
      "..HYYYYYYD..",
      "..HYYYYYYD..",
      "...HYYYYD...",
      "....DDDD....",
      "............"
    ]
  },
  {
    key: 'sikhye',
    id: 612,
    name: '식혜',
    aliases: [612, '612', 'ing_612', 'rec_60', '식혜', '비락식혜'],
    palette: {
      '.': null,
      'S': '#cbd5e1', // 캔 림
      'Y': '#eab308', // 비락식혜 노란 캔
      'R': '#b91c1c', // 비락 레드 로고
      'W': '#ffffff', // 둥둥 뜬 밥알
      'D': '#a16207'  // 그림자
    },
    rows: [
      "....SSSS....",
      "...SSSSSS...",
      "..SYYYYYYS..",
      "..SYYYYYYS..",
      "..SYRRRRYS..",
      "..SYRWWYYS..",
      "..SYRRRRYS..",
      "..SYYYYYYS..",
      "..SY.W.YYS..",
      "..SYY.W.YS..",
      "..SYYYYYYD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'peach_drink',
    id: 613,
    name: '복숭아음료',
    aliases: [613, '613', 'ing_613', '복숭아음료', '2프로', '코코팜'],
    palette: {
      '.': null,
      'S': '#cbd5e1', // 캔 림
      'P': '#fbcfe8', // 연분홍 피치 캔
      'R': '#f43f5e', // 하트 복숭아 과육
      'G': '#22c55e', // 복숭아 잎사귀
      'D': '#f472b6'  // 그림자
    },
    rows: [
      "....SSSS....",
      "...SSSSSS...",
      "..SPPPPPPS..",
      "..SPPGPPPS..",
      "..SPRRRPPS..",
      "..SRRRRRPS..",
      "..SPRRRPPS..",
      "..SPPPPPPS..",
      "..SPPPPPPS..",
      "..SPPPPPPS..",
      "..SPPPPPPD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'pear_drink',
    id: 614,
    name: '배음료',
    aliases: [614, '614', 'ing_614', 'rec_59', '배음료', '갈아만든배'],
    palette: {
      '.': null,
      'S': '#cbd5e1', // 캔 림
      'G': '#15803d', // 갈아만든배 상단 그린
      'Y': '#fef08a', // 배 그림 노랑
      'W': '#ffffff', // 텍스트
      'D': '#ca8a04'  // 그림자
    },
    rows: [
      "....SSSS....",
      "...SSSSSS...",
      "..SGGGGGGS..",
      "..SGGGGGGS..",
      "..SGYYYYGS..",
      "..SYYYYYYS..",
      "..SYYYYYYS..",
      "..SYYYYYYS..",
      "..SYYYYYYS..",
      "..SYYYYYYS..",
      "..SYYYYYYD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'pineapple_juice',
    id: 615,
    name: '파인애플주스',
    aliases: [615, '615', 'ing_615', '파인애플주스'],
    palette: {
      '.': null,
      'S': '#cbd5e1', // 캔 림
      'Y': '#facc15', // 파인애플 옐로우
      'G': '#15803d', // 파인애플 뾰족 잎
      'B': '#78350f', // 파인애플 격자 갈색
      'D': '#ca8a04'  // 그림자
    },
    rows: [
      "....SSSS....",
      "...SSSSSS...",
      "..SYYYYYYS..",
      "..SYGGGGYS..",
      "..SYGBBGYS..",
      "..SYBBBBYS..",
      "..SYBBBBYS..",
      "..SYYYYYYS..",
      "..SYYYYYYS..",
      "..SYYYYYYS..",
      "..SYYYYYYD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'yakult',
    id: 616,
    name: '요구르트',
    aliases: [616, '616', 'ing_616', '요구르트', '야쿠르트'],
    palette: {
      '.': null,
      'R': '#ef4444', // 주황/빨강 호일 뚜껑
      'Y': '#fed7aa', // 야쿠르트 특유의 살구빛/피치 베이지
      'H': '#fff7ed', // 하이라이트
      'B': '#dc2626', // 빨간 허리 띠
      'D': '#ea580c'  // 그림자
    },
    rows: [
      "....RRRR....",
      "....YYYY....",
      "...YYYYYY...",
      "..HYYYYYYD..",
      "..HBBBBBBD..",
      "..HYYYYYYD..",
      "..HYYYYYYD..",
      "..HYYYYYYD..",
      "..HYYYYYYD..",
      "..HYYYYYYD..",
      "..HYYYYYYD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'pomegranate_juice',
    id: 617,
    name: '석류주스',
    aliases: [617, '617', 'ing_617', '석류주스', '미녀는석류를좋아해'],
    palette: {
      '.': null,
      'S': '#cbd5e1', // 캔 림
      'P': '#be123c', // 석류 짙은 레드
      'R': '#fb7185', // 석류 로고
      'D': '#881337'  // 그림자
    },
    rows: [
      "....SSSS....",
      "...SSSSSS...",
      "..SPPPPPPS..",
      "..SPPPPPPS..",
      "..SPPRRPPS..",
      "..SPR..RPS..",
      "..SPPRRPPS..",
      "..SPPPPPPS..",
      "..SPPPPPPS..",
      "..SPPPPPPS..",
      "..SPPPPPPD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'tonic_water',
    id: 618,
    name: '토닉워터',
    aliases: [618, '618', 'ing_618', 'rec_52', '토닉워터'],
    palette: {
      '.': null,
      'C': '#38bdf8', // 파란 캡
      'T': '#e0f2fe', // 투명 바디
      'B': '#0284c7', // 블루 배너
      'W': '#ffffff', // 라벨 텍스트
      'D': '#94a3b8'  // 그림자
    },
    rows: [
      "....CCCC....",
      "....TTTT....",
      "...TTTTTT...",
      "..WTTTTTTD..",
      "..WBBBBBBD..",
      "..WBWWWWBBD.",
      "..WBBBBBBD..",
      "..WTTTTTTD..",
      "..WTTTTTTD..",
      "..WTTTTTTD..",
      "..WTTTTTTD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'calamansi_pouch',
    id: 619,
    name: '깔라만시 원액',
    aliases: [619, '619', 'ing_619', 'rec_53', '깔라만시 원액'],
    palette: {
      '.': null,
      'W': '#ffffff', // 흰색 스파우트 캡
      'G': '#84cc16', // 파우치 연두
      'Y': '#facc15', // 깔라만시 노랑
      'D': '#4d7c0f'  // 그림자
    },
    rows: [
      ".....WW.....",
      ".....WW.....",
      "....GGGG....",
      "...GGGGGG...",
      "..GGYYYYGG..",
      "..GYYYYYYG..",
      "..GYYYYYYGD.",
      "..GYYYYYYGD.",
      "..GYYYYYYGD.",
      "..GGGGGGGD..",
      "...DDDDDD...",
      "............"
    ]
  },
  {
    key: 'iced_americano',
    id: 620,
    name: '아이스 아메리카노',
    aliases: [620, '620', 'ing_620', 'rec_65', '아이스 아메리카노'],
    palette: {
      '.': null,
      'S': '#0f172a', // 검은 빨대
      'L': '#cbd5e1', // 투명 돔리드
      'B': '#451a03', // 아메리카노 다크 브라운
      'I': '#e0f2fe', // 얼음 큐브
      'D': '#292524'  // 그림자
    },
    rows: [
      ".......S....",
      "......S.....",
      "....LLLL....",
      "...LLLLLL...",
      "..LLLLLLLL..",
      "..BBIBBBBB..",
      "..BBBIBBBD..",
      "..BBBBIBBD..",
      "..BBIBBBBD..",
      "...BBBBBBD..",
      "....BBBBD...",
      ".....DD....."
    ]
  },
  {
    key: 'hongcho',
    id: 621,
    name: '홍초',
    aliases: [621, '621', 'ing_621', 'rec_64', '홍초'],
    palette: {
      '.': null,
      'C': '#881337', // 캡
      'R': '#be123c', // 홍초 루비 레드
      'W': '#ffffff', // 라벨
      'D': '#4c0519'  // 그림자
    },
    rows: [
      "....CCCC....",
      "....RRRR....",
      "...RRRRRR...",
      "..WRRRRRRD..",
      "..WRRRRRRD..",
      "..WRWWWWRD..",
      "..WRWWWWRD..",
      "..WRRRRRRD..",
      "..WRRRRRRD..",
      "..WRRRRRRD..",
      "..WRRRRRRD..",
      "...DDDDDD..."
    ]
  }
];
