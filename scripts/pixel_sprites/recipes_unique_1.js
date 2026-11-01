module.exports = [
  // ---------------------------------------------------------------------------
  // UNIQUE RECIPES PART 1: Classic Bombs & Ice-bar Cocktails (18)
  // ---------------------------------------------------------------------------
  {
    key: 'rec_somaek',
    id: 1,
    name: '소맥',
    aliases: [1, '1', 'rec_1', '소맥'],
    palette: {
      '.': null,
      'F': '#ffffff', // 맥주 크림 거품
      'G': '#fde047', // 황금 맥주
      'S': '#f8fafc', // 맑은 소주 레이어
      'C': '#94a3b8', // 맥주잔 외곽 유리
      'H': '#ffffff', // 유리 반사광
      'D': '#ca8a04'  // 바닥 그림자
    },
    rows: [
      "...FFFFFF...",
      "..FFFFFFFF..",
      "..CHGGGGHCD.",
      "..CHGGGGHCD.",
      "..CHGGGGHCD.",
      "..CHGGGGHCD.",
      "..CHSSSSSHCD",
      "..CHSSSSSHCD",
      "..CHSSSSSHCD",
      "..CHHHHHHCD.",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_kkulju',
    id: 2,
    name: '꿀주',
    aliases: [2, '2', 'rec_2', '꿀주'],
    palette: {
      '.': null,
      'G': '#facc15', // 맥주 1방울 (꿀빛 표면)
      'S': '#e0f2fe', // 90% 투명 소주
      'H': '#ffffff', // 유리 림/하이라이트
      'C': '#94a3b8', // 소주잔 유리
      'D': '#64748b'  // 소주잔 두꺼운 밑둥
    },
    rows: [
      "..HHHHHHHH..",
      "..C......C..",
      "..CGGGGGGC..",
      "..CHSSSSHC..",
      "..CHSSSSHC..",
      "..CHSSSSHC..",
      "..CHSSSSHC..",
      "..CHSSSSHC..",
      "..CHSSSSHC..",
      "...CSSSSCD..",
      "...CDDDDCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_hongchaju',
    id: 6,
    name: '홍차주',
    aliases: [6, '6', 'rec_6', '홍차주'],
    palette: {
      '.': null,
      'Y': '#facc15', // 레몬 조각
      'T': '#b91c1c', // 붉은 홍차 리큐어
      'I': '#e0f2fe', // 얼음 큐브
      'H': '#ffffff', // 하이라이트
      'C': '#94a3b8', // 하이볼 잔
      'D': '#7f1d1d'  // 그림자
    },
    rows: [
      "....YYYY....",
      "...CHH..HC..",
      "..CHTIITTHC.",
      "..CHTTTTTHCD",
      "..CHTITITHCD",
      "..CHTTTTTHCD",
      "..CHTIITTHCD",
      "..CHTTTTTHCD",
      "..CHTTTTTHCD",
      "..CHTTTTTHCD",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_kibum_tea',
    id: 7,
    name: '만능열쇠 홍차주',
    aliases: [7, '7', 'rec_7', '만능열쇠 홍차주', '기범주'],
    palette: {
      '.': null,
      'K': '#facc15', // 골드 키 장식 머더러
      'T': '#991b1b', // 진한 홍차 토닉
      'I': '#e0f2fe', // 얼음 큐브
      'H': '#ffffff', // 하이라이트
      'W': '#ffffff', // 토닉 기포
      'C': '#94a3b8', // 글라스
      'D': '#450a0a'  // 그림자
    },
    rows: [
      ".....K.K....",
      ".....KKK....",
      "......K.....",
      "..CH..K.HC..",
      "..CHTTKITHCD",
      "..CHTTWTTTHD",
      "..CHTWTTTTHD",
      "..CHTTTWTHCD",
      "..CHTTTTTHCD",
      "..CHTTTTTHCD",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_energy_soju',
    id: 8,
    name: '에너지주',
    aliases: [8, '8', 'rec_8', '에너지주'],
    palette: {
      '.': null,
      'Z': '#fde047', // 번개 스파크
      'E': '#06b6d4', // 핫식스 사이언
      'G': '#4ade80', // 형광 에너지 그린
      'C': '#94a3b8', // 하이볼 잔
      'H': '#ffffff', // 하이라이트
      'W': '#ffffff',
      'D': '#0e7490'  // 그림자
    },
    rows: [
      "....ZZZZ....",
      "...CH..HC...",
      "..CHEZZZHC..",
      "..CHZEEZHCD.",
      "..CHEZZZHCD.",
      "..CHGGGGHCD.",
      "..CHGEGGHCD.",
      "..CHGGGGHCD.",
      "..CHGGGGHCD.",
      "..CHGGGGHCD.",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_blue_lemon_soju',
    id: 9,
    name: '블루레몬주',
    aliases: [9, '9', 'rec_9', '블루레몬주'],
    palette: {
      '.': null,
      'Y': '#fde047', // 레몬 휠 가니시
      'B': '#00d2ff', // 영롱한 네온 마린 블루
      'I': '#e0f2fe', // 얼음
      'C': '#94a3b8', // 유리잔
      'H': '#ffffff', // 하이라이트
      'W': '#ffffff', // 반사광
      'D': '#0284c7'  // 그림자
    },
    rows: [
      "...YYYY.....",
      "..YYYYYY....",
      "..CW..I.WC..",
      "..CWBBI.WCD.",
      "..CWBBB.WCD.",
      "..CWIBBBWCD.",
      "..CWIBBBWCD.",
      "..CWBBB.WCD.",
      "..CWBBBBWCD.",
      "..CWBBBBWCD.",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_boksosa',
    id: 10,
    name: '복소사',
    aliases: [10, '10', 'rec_10', '복소사'],
    palette: {
      '.': null,
      'R': '#be123c', // 복분자 루비 레드
      'P': '#fb7185', // 사이다 핑크 버블
      'H': '#ffffff', // 하이라이트
      'W': '#ffffff', // 탄산 기포
      'C': '#94a3b8', // 하이볼 잔
      'D': '#4c0519'  // 딥 와인 그림자
    },
    rows: [
      "..W..W...W..",
      "...CH..HC...",
      "..CHRRRRHC..",
      "..CHRPRRHC..",
      "..CHRPWRHCD.",
      "..CHRRRRHCD.",
      "..CHRWPRHCD.",
      "..CHRPRRHCD.",
      "..CHRRRRHCD.",
      "..CHRRRRHCD.",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_icetea',
    id: 13,
    name: '아이스티',
    aliases: [13, '13', 'rec_13', '아이스티'],
    palette: {
      '.': null,
      'M': '#22c55e', // 민트 잎
      'I': '#e0f2fe', // 각얼음
      'A': '#d97706', // 호박색 아이스티
      'C': '#94a3b8', // 글라스
      'H': '#ffffff', // 하이라이트
      'W': '#ffffff',
      'D': '#78350f'  // 그림자
    },
    rows: [
      "....MM......",
      "...CH..HC...",
      "..CHIIIIHC..",
      "..CHIAAIHCD.",
      "..CHAAAAHCD.",
      "..CHIAAIHCD.",
      "..CHAAAAHCD.",
      "..CHAAAAHCD.",
      "..CHAAAAHCD.",
      "..CHAAAAHCD.",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_mango_ringo',
    id: 16,
    name: '망고비어',
    aliases: [16, '16', 'rec_16', '망고비어', '망고링고'],
    palette: {
      '.': null,
      'F': '#ffffff', // 맥주 거품
      'M': '#fbbf24', // 망고 맥주
      'G': '#f59e0b', // 진한 과즙
      'H': '#ffffff', // 하이라이트
      'C': '#94a3b8', // 튤립/필스너 글라스
      'D': '#b45309'  // 그림자
    },
    rows: [
      "...FFFFFF...",
      "..FFFFFFFF..",
      "..CHMMMMHCD.",
      "..CHMMMMHCD.",
      "..CHGGGGHCD.",
      "...CHMMHCD..",
      "....CHHCD...",
      ".....CC.....",
      ".....CC.....",
      "....CCCC....",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_mango_ringoju',
    id: 17,
    name: '망고비어주',
    aliases: [17, '17', 'rec_17', '망고비어주', '망고링고주'],
    palette: {
      '.': null,
      'S': '#fde047', // 망고 과육 엣지
      'M': '#f59e0b', // 망고주 본체
      'H': '#ffffff', // 하이라이트
      'W': '#ffffff', // 얼음 및 반사광
      'C': '#94a3b8', // 온더락 잔
      'D': '#9a3412'  // 그림자
    },
    rows: [
      "....SSSS....",
      "..CH....HC..",
      "..CHWMMMWHC.",
      "..CHMMMMMCD.",
      "..CHMWMMMCD.",
      "..CHMMMMMCD.",
      "..CHMMMMMCD.",
      "..CHMMMMMCD.",
      "..CHMMMMMCD.",
      "..CHMMMMMCD.",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_soju_cola',
    id: 18,
    name: '소콜',
    aliases: [18, '18', 'rec_18', '소콜'],
    palette: {
      '.': null,
      'B': '#451a03', // 상단 다크 콜라
      'S': '#e0f2fe', // 하단 투명 소주
      'H': '#ffffff', // 하이라이트
      'W': '#ffffff', // 톡 쏘는 기포
      'C': '#94a3b8', // 유리잔
      'D': '#1c1917'  // 그림자
    },
    rows: [
      "..W...W..W..",
      "...CH..HC...",
      "..CHBBBBHC..",
      "..CHBBWBHCD.",
      "..CHBWBBHCD.",
      "..CHBBBBHCD.",
      "..CHSSSSSHCD",
      "..CHSWSSSHCD",
      "..CHSSSSSHCD",
      "..CHSSSSSHCD",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_ringelju',
    id: 19,
    name: '링겔주',
    aliases: [19, '19', 'rec_19', '링겔주'],
    palette: {
      '.': null,
      'R': '#881337', // 위 복분자병
      'G': '#16a34a', // 아래 소주병
      'F': '#e11d48', // 흘러내리는 붉은 링겔 줄기
      'W': '#ffffff', // 유리 반사광
      'D': '#14532d'  // 바닥
    },
    rows: [
      "...RRRRRR...",
      "...RRRRRR...",
      "....RRRR....",
      ".....RR.....",
      ".....FF.....",
      ".....FF.....",
      "....GGGG....",
      "...GWFFWGD..",
      "..GWGFFWGGD.",
      "..GWGGGGGGGD",
      "...GGGGGGGD.",
      "....DDDDDD.."
    ]
  },
  {
    key: 'rec_maeksato',
    id: 21,
    name: '맥사토',
    aliases: [21, '21', 'rec_21', '맥사토'],
    palette: {
      '.': null,
      'T': '#ef4444', // 토마토 방울 가니시
      'B': '#fb923c', // 토마토 맥주 오렌지-레드
      'H': '#ffffff', // 하이라이트
      'F': '#ffffff', // 탄산 거품
      'C': '#94a3b8', // 머그잔
      'D': '#9a3412'  // 그림자
    },
    rows: [
      "....TTTT....",
      "...FFFFFF...",
      "..FFFFFFFF..",
      "..CHBBBBHCD.",
      "..CHBBBBHCD.",
      "..CHBBBBHCD.",
      "..CHBBBBHCD.",
      "..CHBBBBHCD.",
      "..CHBBBBHCD.",
      "..CHBBBBHCD.",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_screwbarju',
    id: 24,
    name: '배배꼬인주',
    aliases: [24, '24', 'rec_24', '배배꼬인주', '스크류바주'],
    palette: {
      '.': null,
      'K': '#fde68a', // 꽂힌 나무 막대
      'S': '#ef4444', // 스크류바 아이스바
      'P': '#fbcfe8', // 분홍빛으로 물든 소주 칵테일
      'H': '#ffffff', // 하이라이트
      'W': '#ffffff',
      'C': '#94a3b8', // 하이볼 잔
      'D': '#db2777'  // 그림자
    },
    rows: [
      ".....KK.....",
      "....SSSS....",
      "...SSWWSS...",
      "..CHSSSSHC..",
      "..CHPPPPPHCD",
      "..CHSPPPHHCD",
      "..CHSSPPPHCD",
      "..CHPPPPPHCD",
      "..CHPPPPPHCD",
      "..CHPPPPPHCD",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_maksa',
    id: 27,
    name: '막사',
    aliases: [27, '27', 'rec_27', '막사'],
    palette: {
      '.': null,
      'Y': '#facc15', // 황동 양은 사발 테두리
      'M': '#f8fafc', // 뽀얀 막걸리 탄산
      'W': '#ffffff', // 사이다 탄산 기포
      'D': '#ca8a04'  // 황동 사발 그림자
    },
    rows: [
      "..YYYYYYYY..",
      ".YYYYYYYYYY.",
      "YWWMMWMMWWYD",
      "YMMMWMMMMMYD",
      "YMMMMMMMMMYD",
      ".YMMMMMMMYDD",
      ".YMMMMMMMYD.",
      "..YMMMMMYD..",
      "...YYYYYYD..",
      "....DDDD....",
      "............",
      "............"
    ]
  },
  {
    key: 'rec_choco_soju',
    id: 30,
    name: '초코방울주',
    aliases: [30, '30', 'rec_30', '초코방울주', '초코에몽주'],
    palette: {
      '.': null,
      'W': '#ffffff', // 휘핑크림 / 하이라이트
      'H': '#ffffff', // 하이라이트
      'B': '#542d13', // 초코 칵테일 브라운
      'C': '#94a3b8', // 글라스
      'D': '#271206'  // 그림자
    },
    rows: [
      "....WWWW....",
      "...WWWWWW...",
      "..CHBBBBHC..",
      "..CHBBBBHCD.",
      "..CHWBBBHCD.",
      "..CHBWBBHCD.",
      "..CHBBBBHCD.",
      "..CHBBBBHCD.",
      "..CHBBBBHCD.",
      "..CHBBBBHCD.",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_golden_somaek',
    id: 31,
    name: '황금소맥',
    aliases: [31, '31', 'rec_31', '황금소맥'],
    palette: {
      '.': null,
      'K': '#fef08a', // 황금 스파클
      'F': '#ffffff', // 눈부신 황금 거품
      'G': '#eab308', // 찬란한 황금빛 소맥
      'C': '#ca8a04', // 골드 림 잔
      'D': '#854d0e'  // 그림자
    },
    rows: [
      "..K..K..K...",
      "...FFFFFF...",
      "..FFFFFFFF..",
      "..CGGGGGGCD.",
      "..CGKGGGGCD.",
      "..CGGGKGGCD.",
      "..CGGGGGGCD.",
      "..CGGGGGGCD.",
      "..CGGGGGGCD.",
      "..CGGGGGGCD.",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  },
  {
    key: 'rec_tankboyju',
    id: 33,
    name: '배즙보이주',
    aliases: [33, '33', 'rec_33', '배즙보이주', '탱크보이주'],
    palette: {
      '.': null,
      'P': '#fef08a', // 배 슬러시 얼음
      'H': '#ffffff', // 하이라이트
      'W': '#ffffff', // 프로스트 성에
      'M': '#22c55e', // 민트 잎
      'C': '#94a3b8', // 글라스
      'D': '#ca8a04'  // 그림자
    },
    rows: [
      "....MM......",
      "...PPPPPP...",
      "..PPPPPPPP..",
      "..CHPPPPPHCD",
      "..CHPWPPPHCD",
      "..CHPPWPPHCD",
      "..CHPPPPPHCD",
      "..CHPPPPPHCD",
      "..CHPPPPPHCD",
      "..CHPPPPPHCD",
      "...CCCCCCD..",
      "....DDDD...."
    ]
  }
];
