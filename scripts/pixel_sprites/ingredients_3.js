module.exports = [
  // ---------------------------------------------------------------------------
  // 6. CONDIMENTS & ADDITIVES (양념 및 첨가물: 701~707)
  // ---------------------------------------------------------------------------
  {
    key: 'sugar',
    id: 701,
    name: '설탕',
    aliases: [701, '701', 'ing_701', '설탕'],
    palette: {
      '.': null,
      'W': '#ffffff', // 각설탕 윗면
      'S': '#f1f5f9', // 각설탕 정면
      'G': '#cbd5e1', // 각설탕 측면
      'D': '#94a3b8'  // 그림자
    },
    rows: [
      "....WW......",
      "...WWWW.....",
      "..WSSSSG....",
      "..WSSSSGD...",
      "...DDDD.WW..",
      ".......WWWW.",
      "......WSSSSG",
      "......WSSSSG",
      ".......DDDD.",
      "............",
      "............",
      "............"
    ]
  },
  {
    key: 'nuruk',
    id: 702,
    name: '누룩',
    aliases: [702, '702', 'ing_702', 'rec_25', '누룩'],
    palette: {
      '.': null,
      'H': '#fef3c7', // 밝은 밀 누룩 표면
      'N': '#f59e0b', // 누룩 황갈색
      'C': '#b45309', // 발효 크랙 라인
      'D': '#78350f'  // 밑면 그림자
    },
    rows: [
      "....HHHH....",
      "...HNNNNH...",
      "..HNNCNNNH..",
      ".HNNCCNCNND.",
      ".HNCNNNCNND.",
      ".HNNNCCNnND.".replace('n', 'N'),
      ".HNCCNNCnND.".replace('n', 'N'),
      "..HNNCNNND..",
      "...DNNNND...",
      "....DDDD....",
      "............",
      "............"
    ]
  },
  {
    key: 'yuzu_cheong',
    id: 703,
    name: '유자청',
    aliases: [703, '703', 'ing_703', 'rec_36', '유자청'],
    palette: {
      '.': null,
      'C': '#ca8a04', // 금색 뚜껑
      'G': '#fef9c3', // 유리병
      'Y': '#facc15', // 유자청 젤리
      'O': '#ea580c', // 유자 껍질 슬라이스
      'D': '#a16207'  // 바닥 그림자
    },
    rows: [
      "...CCCCCC...",
      "...CCCCCC...",
      "..GGGGGGGG..",
      "..GYYYYYYG..",
      "..GYOOYYYG..",
      "..GYYYYOYG..",
      "..GYOYOYYG..",
      "..GYYYYYYG..",
      "..GYYYYYYGD.",
      "..GGGGGGGGDD",
      "...DDDDDD...",
      "............"
    ]
  },
  {
    key: 'maesil_cheong',
    id: 704,
    name: '매실청',
    aliases: [704, '704', 'ing_704', 'rec_37', '매실청'],
    palette: {
      '.': null,
      'C': '#78350f', // 코르크/갈색 뚜껑
      'T': '#fef3c7', // 유리병 목
      'A': '#b45309', // 진한 호박색 매실청
      'M': '#65a30d', // 속에 잠긴 초록 매실
      'D': '#451a03'  // 그림자
    },
    rows: [
      "....CCCC....",
      "....TTTT....",
      "...AAAAAA...",
      "..AAAAAAAA..",
      "..AAAAAMAA..",
      "..AAAMMMAD..",
      "..AAAAMMAAD.",
      "..AAAMAAAD..",
      "..AAAMMMAAD.",
      "..AAAAAAAD..",
      "...DDDDDD...",
      "............"
    ]
  },
  {
    key: 'honey',
    id: 705,
    name: '꿀',
    aliases: [705, '705', 'ing_705', '꿀'],
    palette: {
      '.': null,
      'C': '#b45309', // 꿀단지 뚜껑
      'P': '#d97706', // 꿀단지 몸체 (토기)
      'H': '#fde047', // 흘러내리는 꿀
      'Y': '#eab308', // 황금빛 꿀
      'D': '#78350f'  // 그림자
    },
    rows: [
      "....CCCC....",
      "...PPPPPP...",
      "..PPYYYYPP..",
      "..PYHYYYYP..",
      ".PYYYYYYYYPD",
      ".PYYYHYYYYPD",
      ".PPYYHYYYPPD",
      "..PPPYHPPPD.",
      "...PPDHPDD..",
      ".....DHD....",
      "......D.....",
      "............"
    ]
  },
  {
    key: 'vinegar',
    id: 706,
    name: '식초',
    aliases: [706, '706', 'ing_706', 'rec_62', '식초', '양조식초'],
    palette: {
      '.': null,
      'Y': '#facc15', // 오뚜기 노란 캡
      'T': '#fef9c3', // 병 목
      'V': '#d97706', // 식초 황금-갈색
      'W': '#ffffff', // 라벨
      'D': '#78350f'  // 그림자
    },
    rows: [
      "....YYYY....",
      "....TTTT....",
      "...TTTTTT...",
      "..WVVVVVVD..",
      "..WVVVVVVD..",
      "..WVWWWWVD..",
      "..WVWWWWVD..",
      "..WVVVVVVD..",
      "..WVVVVVVD..",
      "..WVVVVVVD..",
      "..WVVVVVVD..",
      "...DDDDDD..."
    ]
  },
  {
    key: 'pomegranate_concentrate',
    id: 707,
    name: '석류농축액',
    aliases: [707, '707', 'ing_707', 'rec_63', '석류농축액'],
    palette: {
      '.': null,
      'K': '#4a044e', // 스포이드/뚜껑 블랙
      'R': '#881337', // 짙은 석류 농축액
      'H': '#f43f5e', // 하이라이트
      'D': '#2a0606'  // 어두운 그림자
    },
    rows: [
      ".....KK.....",
      "....KKKK....",
      "....KKKK....",
      "...RRRRRR...",
      "..HRRRRRRD..",
      "..HRRRRRRD..",
      "..HRRRRRRD..",
      "..HRRRRRRD..",
      "..HRRRRRRD..",
      "..HRRRRRRD..",
      "...DDDDDD...",
      "............"
    ]
  },

  // ---------------------------------------------------------------------------
  // 7. ICE BARS & DESSERTS (빙과 및 디저트: 801~806)
  // ---------------------------------------------------------------------------
  {
    key: 'screwbar',
    id: 801,
    name: '배배꼬인바',
    aliases: [801, '801', 'ing_801', 'rec_23', '배배꼬인바', '스크류바'],
    palette: {
      '.': null,
      'R': '#ef4444', // 스크류바 빨강
      'P': '#fbcfe8', // 나선형 흰/분홍 소용돌이
      'D': '#991b1b', // 빨강 음영
      'S': '#d97706', // 아이스크림 나무 막대
      'K': '#92400e'  // 막대 그림자
    },
    rows: [
      "....RR......",
      "...RPPR.....",
      "..RPPPRD....",
      "..RPRRRD....",
      "..RRRPPD....",
      "..RRPPPD....",
      "..RPRRRD....",
      "...RRRD.....",
      "....SS......",
      "....SK......",
      "....SK......",
      "............"
    ]
  },
  {
    key: 'chocolate',
    id: 802,
    name: '초콜릿',
    aliases: [802, '802', 'ing_802', 'rec_28', '초콜릿', '가나초콜릿'],
    palette: {
      '.': null,
      'R': '#dc2626', // 가나 레드 포장지
      'G': '#fde047', // 금박 호일
      'B': '#542d13', // 초콜릿 블록 다크 브라운
      'H': '#78350f', // 초콜릿 하이라이트
      'D': '#271206'  // 격자 홈 그림자
    },
    rows: [
      "...HBHBH....",
      "...BDDBD....",
      "...HBHBH....",
      "...BDDBD....",
      "..GGGGGGGG..",
      "..GRRRRRRG..",
      "..RRRRRRRR..",
      "..RRRRRRRR..",
      "..RRRRRRRR..",
      "..RRRRRRRRD.",
      "..RRRRRRRRD.",
      "...DDDDDD..."
    ]
  },
  {
    key: 'tankboy',
    id: 803,
    name: '배즙보이',
    aliases: [803, '803', 'ing_803', 'rec_32', '배즙보이', '탱크보이'],
    palette: {
      '.': null,
      'W': '#ffffff', // 튜브 마개 캡
      'P': '#fef08a', // 배 슬러시 파우치 연노랑
      'G': '#16a34a', // 꼭지 잎 그림
      'B': '#0284c7', // 탱크보이 파란 글씨
      'D': '#eab308'  // 그림자
    },
    rows: [
      "....WWWW....",
      ".....WW.....",
      "...PPPPPP...",
      "..HPPGGPDD..".replace('H', 'P'),
      "..HPPBBPDD..".replace('H', 'P'),
      "..HPPBBPDD..".replace('H', 'P'),
      "..HPPPGPDD..".replace('H', 'P'),
      "..HPPPPPDD..".replace('H', 'P'),
      "..HPPPPPDD..".replace('H', 'P'),
      "...PPPPPD...",
      "....DDDD....",
      "............"
    ]
  },
  {
    key: 'melona',
    id: 804,
    name: '올때메론바',
    aliases: [804, '804', 'ing_804', 'rec_3', '올때메론바', '메로나'],
    palette: {
      '.': null,
      'G': '#bef264', // 메로나 사각 멜론 연두색
      'H': '#d9f99d', // 하이라이트
      'D': '#65a30d', // 직사각형 모서리 음영
      'S': '#fde68a', // 아이스바 나무 스틱
      'K': '#d97706'  // 막대 음영
    },
    rows: [
      "...HHHHH....",
      "..HGGGGGD...",
      "..HGGGGGD...",
      "..HGGGGGD...",
      "..HGGGGGD...",
      "..HGGGGGD...",
      "..HGGGGGD...",
      "..HGGGGGD...",
      "...DDDDD....",
      "....SS......",
      "....SK......",
      "....SK......"
    ]
  },
  {
    key: 'jawsbar',
    id: 805,
    name: '상어바',
    aliases: [805, '805', 'ing_805', 'rec_66', '상어바', '죠스바'],
    palette: {
      '.': null,
      'N': '#334155', // 상어 네이비/회색 겉면
      'L': '#64748b', // 하이라이트
      'R': '#ef4444', // 한입 베어문 속살 딸기 레드
      'W': '#ffffff', // 상어 이빨 톱니
      'S': '#fde68a', // 나무 스틱
      'K': '#d97706'  // 막대 그림자
    },
    rows: [
      "....LL......",
      "...LLNN.....",
      "..LNNNNN....",
      "..LNNRRNW...",
      "..LNRRRRN...",
      "..LNRRRRN...",
      "..LNNNNN....",
      "..LNNNNN....",
      "...NNNN.....",
      "....SS......",
      "....SK......",
      "....SK......"
    ]
  },
  {
    key: 'bibibig',
    id: 806,
    name: '단팥바',
    aliases: [806, '806', 'ing_806', 'rec_67', '단팥바', '비비빅'],
    palette: {
      '.': null,
      'P': '#701a75', // 짙은 팥색 원형 바디
      'H': '#a21caf', // 하이라이트
      'B': '#4a044e', // 콕콕 박힌 통단팥 알갱이
      'D': '#2e0854', // 그림자
      'S': '#fde68a', // 나무 막대
      'K': '#d97706'  // 스틱 그림자
    },
    rows: [
      "....HHHH....",
      "...HPPPPH...",
      "..HPPBPBPD..",
      "..HPBPBPPPD.",
      "..HPPPBPPPD.",
      "..HPBPBPPPD.",
      "..HPPBPBPDD.",
      "..HPPPPPPDD.",
      "...DDDDDD...",
      "....SS......",
      "....SK......",
      "....SK......"
    ]
  }
];
