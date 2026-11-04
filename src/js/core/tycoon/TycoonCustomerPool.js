window.KSool = window.KSool || {};

/**
 * 🏮 주막 타이쿤 (Tycoon Main Game) - 손님 도감 & 단골 아바타/성격 생성기
 *
 * [핵심 기획]
 * - 매번 찾아오는 손님은 유니크한 캐릭터(외형 + 이름 + 칭호 + 고정 최애 조합 + 고정 빼기 취향)를 가집니다.
 * - 헷갈리는 요소(Confusable visual traits):
 *   쌍둥이/형제/라이벌처럼 비슷한 모자(갓, 중절모, 비니, 왕관, 머리띠), 비슷한 수염(구레나룻, 콧수염, 산적수염, 염소수염),
 *   비슷한 안경(외알안경, 뿔테, 선글라스), 비슷한 복장(한복, 정장, 가죽자켓, 앞치마)을 조합해
 *   자세히 보지 않으면 헷갈리는 32명의 고유 단골 손님 풀을 생성합니다.
 * - 각 손님은 항상 '자신만의 고정 레시피(signatureRecipeId)'를 주문합니다.
 * - 첫 방문(또는 일반 주문)에서는 "저는 항상 [술이름]만 마셔요! 잘 기억해두세요~"라며 메뉴를 알려주지만,
 *   단골 재방문 + 높은 난이도에서는 "사장님! 늘 먹던 걸로 주세요!" (메모리 주문) 또는
 *   "늘 먹던 거에서 [특정 재료]는 빼고 주세요!" (메모리 + 빼기 복합 주문)를 시킵니다!
 */
class TycoonCustomerPool {
  constructor(recipeBook, brandResolver) {
    this.recipeBook = recipeBook;
    this.brandResolver = brandResolver;
    this.customers = [];
    this._initCustomerRoster();
  }

  _initCustomerRoster() {
    // 헷갈리기 쉬운 외형 파츠 정의 (SVG 레이어 조합용)
    // Group A: 전통 갓/한복 패밀리 (4명 - 수염/안경/띠 색깔만 다름)
    // Group B: 모던 중절모/정장 신사 패밀리 (4명 - 안경/수염/넥타이만 다름)
    // Group C: 힙스터 비니/후드 패밀리 (4명 - 비니 줄무늬/선글라스/수염만 다름)
    // Group D: 동네 포차 아재/캡모자 패밀리 (4명 - 모자 방향/수염/조끼만 다름)
    // Group E: 귀족/왕관/마님 패밀리 (4명 - 머리장식/안경/부채만 다름)
    // Group F: 요리사/장인/머리띠 패밀리 (4명 - 두건/수염/복장만 다름)
    // Group G: 학자/박사/뿔테 패밀리 (4명 - 헤어/안경테/수염만 다름)
    // Group H: 야간 라이더/선글라스 패밀리 (4명 - 헬멧/고글/수염만 다름)

    const archetypes = [
      // === Group A: 조선 선비 (갓 + 한복, 수염과 안경이 미묘하게 다름!) ===
      {
        id: 'cust_01',
        group: '선비파',
        name: '김진사',
        title: '외알안경 긴수염 선비',
        traitHint: '검은 갓 · 외알안경 · 긴 흰수염 · 푸른 도포',
        skin: '#fde68a',
        hat: 'GAT_BLACK',
        hair: 'TOP_KNOT',
        eyes: 'MONOCLE_LEFT',
        beard: 'LONG_WHITE',
        outfit: 'HANBOK_BLUE',
        accent: '#38bdf8',
        preferredRecipeId: 5, // 소주 (Step 1)
        preferredOmitIngId: 203, // 불 빼기
        greeting: '에헴, 내 푸른 도포와 외알안경을 기억해주게! 난 언제나 깔끔한 기본이 좋네.'
      },
      {
        id: 'cust_02',
        group: '선비파',
        name: '이진사',
        title: '둥근안경 긴수염 선비',
        traitHint: '검은 갓 · 둥근안경 · 긴 흰수염 · 푸른 도포',
        skin: '#fde68a',
        hat: 'GAT_BLACK',
        hair: 'TOP_KNOT',
        eyes: 'ROUND_GLASSES',
        beard: 'LONG_WHITE',
        outfit: 'HANBOK_BLUE',
        accent: '#60a5fa',
        preferredRecipeId: 26, // 막걸리
        preferredOmitIngId: 702, // 누룩 빼기
        greeting: '김진사와 도포도 수염도 같지만 난 양쪽 둥근안경을 썼다네! 내 술은 막걸리뿐이야.'
      },
      {
        id: 'cust_03',
        group: '선비파',
        name: '박어사',
        title: '외알안경 검은수염 어사',
        traitHint: '검은 갓 · 외알안경 · 짧은 검은수염 · 붉은 도포',
        skin: '#fcd34d',
        hat: 'GAT_RED_STRING',
        hair: 'TOP_KNOT',
        eyes: 'MONOCLE_LEFT',
        beard: 'GOATEE_BLACK',
        outfit: 'HANBOK_RED',
        accent: '#f87171',
        preferredRecipeId: 20, // 매실주
        preferredOmitIngId: 701, // 설탕 빼기
        greeting: '붉은 갓끈에 검은 턱수염! 김진사 영감과 외알안경은 같아도 난 매실주만 마신다오.'
      },
      {
        id: 'cust_04',
        group: '선비파',
        name: '최훈장',
        title: '맨눈 긴수염 훈장님',
        traitHint: '검은 갓 · 안경없음 · 긴 회색수염 · 초록 도포',
        skin: '#fde68a',
        hat: 'GAT_BLACK',
        hair: 'TOP_KNOT',
        eyes: 'SHARP_EYES',
        beard: 'LONG_GRAY',
        outfit: 'HANBOK_GREEN',
        accent: '#34d399',
        preferredRecipeId: 57, // 복분자주
        preferredOmitIngId: 701, // 설탕 빼기
        greeting: '안경 쓴 선비들과 헷갈리지 말게! 초록 도포의 최훈장은 복분자주 한 잔이면 족하네.'
      },

      // === Group B: 경성 모던보이 (중절모 + 수트, 콧수염과 선글라스 차이!) ===
      {
        id: 'cust_05',
        group: '신사파',
        name: '구보씨',
        title: '갈색중절모 나비넥타이 신사',
        traitHint: '갈색 중절모 · 둥근안경 · 카이저 콧수염 · 빨간 나비넥타이',
        skin: '#fed7aa',
        hat: 'FEDORA_BROWN',
        hair: 'POMADE',
        eyes: 'ROUND_GLASSES',
        beard: 'MUSTACHE_CURL',
        outfit: 'SUIT_BOWTIE_RED',
        accent: '#fb923c',
        preferredRecipeId: 1, // 소맥
        preferredOmitIngId: 102, // 맥주 빼기
        greeting: '빨간 나비넥타이에 말아올린 콧수염! 퇴근길엔 역시 황금 소맥 아니겠소?'
      },
      {
        id: 'cust_06',
        group: '신사파',
        name: '이상씨',
        title: '갈색중절모 파란넥타이 시인',
        traitHint: '갈색 중절모 · 둥근안경 · 턱수염 · 파란 넥타이',
        skin: '#fed7aa',
        hat: 'FEDORA_BROWN',
        hair: 'POMADE',
        eyes: 'ROUND_GLASSES',
        beard: 'GOATEE_BLACK',
        outfit: 'SUIT_TIE_BLUE',
        accent: '#38bdf8',
        preferredRecipeId: 65, // 아이스 아메리카노
        preferredOmitIngId: 201, // 얼음 빼기
        greeting: '구보씨와 모자·안경은 같지만 난 파란 넥타이에 턱수염이라오. 차가운 커피 한 잔 주시오.'
      },
      {
        id: 'cust_07',
        group: '신사파',
        name: '백사장',
        title: '검은중절모 선글라스 사장',
        traitHint: '검은 중절모 · 금테 선글라스 · 카이저 콧수염 · 정장',
        skin: '#fcd34d',
        hat: 'FEDORA_BLACK',
        hair: 'POMADE',
        eyes: 'SUNGLASSES_GOLD',
        beard: 'MUSTACHE_CURL',
        outfit: 'SUIT_BOWTIE_RED',
        accent: '#facc15',
        preferredRecipeId: 27, // 고진감래주
        preferredOmitIngId: 607, // 콜라 빼기
        greeting: '검은 중절모에 금테 선글라스! 내 인생처럼 쓴맛 끝에 단맛이 오는 고진감래주가 내 단골이지.'
      },
      {
        id: 'cust_08',
        group: '신사파',
        name: '마국장',
        title: '검은중절모 외알안경 국장',
        traitHint: '검은 중절모 · 외알안경 · 수염없음 · 파란 넥타이',
        skin: '#fed7aa',
        hat: 'FEDORA_BLACK',
        hair: 'POMADE',
        eyes: 'MONOCLE_LEFT',
        beard: 'NONE',
        outfit: 'SUIT_TIE_BLUE',
        accent: '#818cf8',
        preferredRecipeId: 83, // 조선 깔루아 밀크
        preferredOmitIngId: 401, // 우유 빼기
        greeting: '수염 없이 깔끔한 외알안경에 검은 중절모! 달콤쌉싸름한 조선 깔루아 밀크 부탁하오.'
      },

      // === Group C: 홍대 힙스터 (비니 + 후드, 비니 색상과 안경/수염 차이!) ===
      {
        id: 'cust_09',
        group: '힙스터파',
        name: '제이든',
        title: '빨간비니 뿔테 DJ',
        traitHint: '빨간 비니 · 굵은 뿔테안경 · 턱수염 · 보라 후드',
        skin: '#fde68a',
        hat: 'BEANIE_RED',
        hair: 'SIDE_SHAVE',
        eyes: 'HORN_GLASSES',
        beard: 'GOATEE_BLACK',
        outfit: 'HOODIE_PURPLE',
        accent: '#f43f5e',
        preferredRecipeId: 10, // 에너자이저주
        preferredOmitIngId: 603, // 이온음료 빼기
        greeting: 'Yo! 빨간 비니에 보라 후드 제이든이야! 밤새 디제잉하려면 에너자이저주가 필수지!'
      },
      {
        id: 'cust_10',
        group: '힙스터파',
        name: '케이시',
        title: '빨간비니 선글라스 래퍼',
        traitHint: '빨간 비니 · 선글라스 · 턱수염 · 검정 후드',
        skin: '#fde68a',
        hat: 'BEANIE_RED',
        hair: 'SIDE_SHAVE',
        eyes: 'SUNGLASSES_DARK',
        beard: 'GOATEE_BLACK',
        outfit: 'HOODIE_BLACK',
        accent: '#e11d48',
        preferredRecipeId: 18, // 소콜
        preferredOmitIngId: 607, // 콜라 빼기
        greeting: '제이든이랑 빨간 비니는 같아도 난 선글라스에 검정 후드야! 달달한 소콜 한 잔 부탁해!'
      },
      {
        id: 'cust_11',
        group: '힙스터파',
        name: '민트민',
        title: '민트비니 뿔테 아티스트',
        traitHint: '민트 비니 · 굵은 뿔테안경 · 수염없음 · 보라 후드',
        skin: '#fef08a',
        hat: 'BEANIE_MINT',
        hair: 'BOB_CUT',
        eyes: 'HORN_GLASSES',
        beard: 'NONE',
        outfit: 'HOODIE_PURPLE',
        accent: '#2dd4bf',
        preferredRecipeId: 16, // 망고비어
        preferredOmitIngId: 303, // 망고 빼기
        greeting: '민트색 비니에 수염 없는 뿔테! 전 트로피컬한 망고비어만 마시는 거 아시죠?'
      },
      {
        id: 'cust_12',
        group: '힙스터파',
        name: '레오',
        title: '민트비니 선글라스 댄서',
        traitHint: '민트 비니 · 선글라스 · 콧수염 · 검정 후드',
        skin: '#fcd34d',
        hat: 'BEANIE_MINT',
        hair: 'SIDE_SHAVE',
        eyes: 'SUNGLASSES_DARK',
        beard: 'MUSTACHE_THIN',
        outfit: 'HOODIE_BLACK',
        accent: '#14b8a6',
        preferredRecipeId: 9, // 레몬소주
        preferredOmitIngId: 201, // 얼음 빼기
        greeting: '민트 비니에 얇은 콧수염과 선글라스! 상큼하게 톡 쏘는 레몬소주가 내 시그니처야.'
      },

      // === Group D: 동네 단골 아재 (야구모자 + 조끼, 모자 색상과 수염 모양 차이!) ===
      {
        id: 'cust_13',
        group: '단골아재파',
        name: '황반장',
        title: '파란모자 산적수염 반장님',
        traitHint: '파란 캡모자 · 둥근안경 · 덥수룩 산적수염 · 낚시조끼',
        skin: '#fdba74',
        hat: 'CAP_BLUE',
        hair: 'SHORT_CURL',
        eyes: 'ROUND_GLASSES',
        beard: 'FULL_BUSHY',
        outfit: 'VEST_KHAKI',
        accent: '#3b82f6',
        preferredRecipeId: 6, // 황금 소맥
        preferredOmitIngId: 101, // 소주 빼기
        greeting: '허허! 파란 모자에 산적수염 황반장이야! 난 그냥 소맥 말고 무조건 황금비율 소맥이여!'
      },
      {
        id: 'cust_14',
        group: '단골아재파',
        name: '강소장',
        title: '파란모자 콧수염 소장님',
        traitHint: '파란 캡모자 · 둥근안경 · 일자 콧수염 · 낚시조끼',
        skin: '#fdba74',
        hat: 'CAP_BLUE',
        hair: 'SHORT_CURL',
        eyes: 'ROUND_GLASSES',
        beard: 'MUSTACHE_FLAT',
        outfit: 'VEST_KHAKI',
        accent: '#2563eb',
        preferredRecipeId: 19, // 링겔주
        preferredOmitIngId: 104, // 매실주 빼기
        greeting: '황반장이랑 모자·조끼는 똑같아도 내 수염은 깔끔한 일자 콧수염이지! 난 링겔주만 마셔!'
      },
      {
        id: 'cust_15',
        group: '단골아재파',
        name: '오기사',
        title: '노란모자 산적수염 기사님',
        traitHint: '노란 캡모자 · 안경없음 · 덥수룩 산적수염 · 등산복',
        skin: '#fca5a5',
        hat: 'CAP_YELLOW',
        hair: 'SHORT_CURL',
        eyes: 'SMILE_EYES',
        beard: 'FULL_BUSHY',
        outfit: 'JACKET_ORANGE',
        accent: '#eab308',
        preferredRecipeId: 44, // 유자막걸리
        preferredOmitIngId: 703, // 유자청 빼기
        greeting: '노란 모자에 주황 등산복 입은 오기사요! 산행 끝엔 달콤향긋한 유자막걸리가 최고지!'
      },
      {
        id: 'cust_16',
        group: '단골아재파',
        name: '변사장',
        title: '노란모자 뿔테 세탁소사장',
        traitHint: '노란 캡모자 · 뿔테안경 · 일자 콧수염 · 낚시조끼',
        skin: '#fed7aa',
        hat: 'CAP_YELLOW',
        hair: 'SHORT_CURL',
        eyes: 'HORN_GLASSES',
        beard: 'MUSTACHE_FLAT',
        outfit: 'VEST_KHAKI',
        accent: '#ca8a04',
        preferredRecipeId: 73, // 밀키스주
        preferredOmitIngId: 102, // 맥주 빼기
        greeting: '노란 모자에 뿔테안경 변사장입니다. 부드럽게 톡 쏘는 밀키스주 한 잔 말아주소!'
      },

      // === Group E: 로열 패밀리 (왕관/족두리 + 화려한 의상) ===
      {
        id: 'cust_17',
        group: '로열파',
        name: '강화도령',
        title: '금관 외알안경 도령',
        traitHint: '금빛 왕관 · 외알안경 · 턱수염 · 보라 곤룡포',
        skin: '#fef3c7',
        hat: 'CROWN_GOLD',
        hair: 'TOP_KNOT',
        eyes: 'MONOCLE_LEFT',
        beard: 'GOATEE_BLACK',
        outfit: 'ROYAL_PURPLE',
        accent: '#f59e0b',
        preferredRecipeId: 38, // 태극주
        preferredOmitIngId: 103, // 복분자주 빼기
        greeting: '금관에 보라색 예복을 입은 강화도령이다! 붉고 푸른 조화의 태극주를 올리거라!'
      },
      {
        id: 'cust_18',
        group: '로열파',
        name: '안동대감',
        title: '금관 긴수염 대감',
        traitHint: '금빛 왕관 · 안경없음 · 긴 흰수염 · 보라 곤룡포',
        skin: '#fef3c7',
        hat: 'CROWN_GOLD',
        hair: 'TOP_KNOT',
        eyes: 'SHARP_EYES',
        beard: 'LONG_WHITE',
        outfit: 'ROYAL_PURPLE',
        accent: '#d97706',
        preferredRecipeId: 40, // 꿀막걸리
        preferredOmitIngId: 705, // 꿀 빼기
        greeting: '강화도령과 옷차림은 같으나 난 긴 백수염이 있지! 달콤한 꿀막걸리 한 사발 가져오너라.'
      },
      {
        id: 'cust_19',
        group: '로열파',
        name: '명동마님',
        title: '은관 보석안경 마님',
        traitHint: '은빛 티아라 · 빨간 뿔테 · 수염없음 · 붉은 비단옷',
        skin: '#fffbeb',
        hat: 'TIARA_SILVER',
        hair: 'UPDO_BUN',
        eyes: 'RED_GLASSES',
        beard: 'NONE',
        outfit: 'SILK_RED',
        accent: '#ec4899',
        preferredRecipeId: 80, // 올때메론주
        preferredOmitIngId: 606, // 사이다 빼기
        greeting: '은빛 티아라에 빨간 안경 명동마님이에요~ 달콤시원한 올때메론주 한 잔 부탁해요!'
      },
      {
        id: 'cust_20',
        group: '로열파',
        name: '서초마담',
        title: '은관 선글라스 마담',
        traitHint: '은빛 티아라 · 금테 선글라스 · 수염없음 · 붉은 비단옷',
        skin: '#fffbeb',
        hat: 'TIARA_SILVER',
        hair: 'UPDO_BUN',
        eyes: 'SUNGLASSES_GOLD',
        beard: 'NONE',
        outfit: 'SILK_RED',
        accent: '#db2777',
        preferredRecipeId: 81, // 상어바주
        preferredOmitIngId: 618, // 토닉워터 빼기
        greeting: '명동마님과 티아라는 같지만 전 금테 선글라스랍니다! 죠스처럼 짜릿한 상어바주 주세요~'
      },

      // === Group F: 장인/셰프 패밀리 (머리띠/두건 + 앞치마) ===
      {
        id: 'cust_21',
        group: '장인파',
        name: '불주먹최씨',
        title: '붉은머리띠 산적수염 주방장',
        traitHint: '붉은 머리띠 · 날카로운 눈 · 산적수염 · 흰 요리복',
        skin: '#fed7aa',
        hat: 'HEADBAND_RED',
        hair: 'SPIKY_BLACK',
        eyes: 'SHARP_EYES',
        beard: 'FULL_BUSHY',
        outfit: 'CHEF_WHITE',
        accent: '#ef4444',
        preferredRecipeId: 24, // 죠스주
        preferredOmitIngId: 606, // 사이다 빼기
        greeting: '붉은 머리띠에 덥수룩한 수염! 불주먹 최씨에겐 상큼청량한 죠스주가 딱이지!'
      },
      {
        id: 'cust_22',
        group: '장인파',
        name: '칼잡이류씨',
        title: '붉은머리띠 콧수염 초밥왕',
        traitHint: '붉은 머리띠 · 날카로운 눈 · 얇은 콧수염 · 흰 요리복',
        skin: '#fed7aa',
        hat: 'HEADBAND_RED',
        hair: 'SPIKY_BLACK',
        eyes: 'SHARP_EYES',
        beard: 'MUSTACHE_THIN',
        outfit: 'CHEF_WHITE',
        accent: '#dc2626',
        preferredRecipeId: 51, // 하이볼
        preferredOmitIngId: 301, // 레몬 빼기
        greeting: '불주먹 최씨와 머리띠는 같지만 난 날렵한 콧수염이야! 깔끔한 하이볼 한 잔 부탁하네.'
      },
      {
        id: 'cust_23',
        group: '장인파',
        name: '단팥할멈',
        title: '흰두건 둥근안경 할머니',
        traitHint: '하얀 두건 · 둥근안경 · 수염없음 · 갈색 앞치마',
        skin: '#fde68a',
        hat: 'BANDANA_WHITE',
        hair: 'GRAY_BUN',
        eyes: 'ROUND_GLASSES',
        beard: 'NONE',
        outfit: 'APRON_BROWN',
        accent: '#a855f7',
        preferredRecipeId: 85, // 단팥죽
        preferredOmitIngId: 701, // 설탕 빼기
        greeting: '하얀 두건에 둥근안경 쓴 단팥할멈이여~ 따끈하고 구수한 단팥죽 한 그릇 주구려.'
      },
      {
        id: 'cust_24',
        group: '장인파',
        name: '약초할배',
        title: '흰두건 긴수염 약초꾼',
        traitHint: '하얀 두건 · 둥근안경 · 긴 회색수염 · 갈색 앞치마',
        skin: '#fde68a',
        hat: 'BANDANA_WHITE',
        hair: 'GRAY_BUN',
        eyes: 'ROUND_GLASSES',
        beard: 'LONG_GRAY',
        outfit: 'APRON_BROWN',
        accent: '#9333ea',
        preferredRecipeId: 74, // 홍초소주
        preferredOmitIngId: 204, // 탄산수 빼기
        greeting: '할멈이랑 두건·안경은 같아도 난 긴 회색 수염이 있다네! 새콤한 홍초소주 한 잔 주게!'
      }
    ];

    // 실제 RecipeBook에 존재하는 레시피인지 검증하고, 없으면 기본 레시피로 안전 매핑
    const allRecipes = this.recipeBook.getAllRecipes();
    const fallbackIds = allRecipes.map(r => r.recipe_id);

    this.customers = archetypes.map((arch, idx) => {
      let rec = this.recipeBook.getRecipe(arch.preferredRecipeId);
      if (!rec && allRecipes.length > 0) {
        rec = allRecipes[idx % allRecipes.length];
      }
      if (allRecipes.length > 0) this._rosterSynced = true;
      const rId = rec ? rec.recipe_id : (arch.preferredRecipeId || fallbackIds[0] || 5);
      const items = this.recipeBook.getRecipeItems(rId);
      // preferredOmitIngId가 실제 해당 레시피 재료에 포함되어 있는지 확인, 없으면 마지막 재료로 자동 보정
      let omitIngId = arch.preferredOmitIngId;
      if (items.length > 0 && !items.some(it => Number(it.ingredient_id) === Number(omitIngId))) {
        omitIngId = Number(items[items.length - 1].ingredient_id);
      }

      return {
        ...arch,
        preferredRecipeId: rId,
        preferredOmitIngId: omitIngId
      };
    });
  }

  getAllCustomers() {
    if (!this._rosterSynced && this.recipeBook && this.recipeBook.getAllRecipes().length > 0) {
      this._initCustomerRoster();
    }
    return this.customers;
  }

  getCustomerById(id) {
    if (!this._rosterSynced && this.recipeBook && this.recipeBook.getAllRecipes().length > 0) {
      this._initCustomerRoster();
    }
    return this.customers.find(c => c.id === id) || this.customers[0];
  }

  /**
   * 고유 손님의 SVG 아바타 렌더링 (모자, 안경, 수염, 복장이 뚜렷하게 구분되면서도 패밀리끼리 헷갈리는 디자인)
   */
  renderCustomerAvatarSvg(customer, size = 56) {
    if (!customer) return '🧑';
    const c = customer;

    // 1. 의상 레이어
    let outfitSvg = '';
    if (c.outfit === 'HANBOK_BLUE') {
      outfitSvg = `<path d="M10 58 Q32 44 54 58 L58 64 L6 64 Z" fill="#1e40af" stroke="#60a5fa" stroke-width="1.5"/><path d="M24 48 L32 58 L40 48" fill="none" stroke="#f8fafc" stroke-width="2.5"/>`;
    } else if (c.outfit === 'HANBOK_RED') {
      outfitSvg = `<path d="M10 58 Q32 44 54 58 L58 64 L6 64 Z" fill="#991b1b" stroke="#f87171" stroke-width="1.5"/><path d="M24 48 L32 58 L40 48" fill="none" stroke="#fde047" stroke-width="2.5"/>`;
    } else if (c.outfit === 'HANBOK_GREEN') {
      outfitSvg = `<path d="M10 58 Q32 44 54 58 L58 64 L6 64 Z" fill="#065f46" stroke="#34d399" stroke-width="1.5"/><path d="M24 48 L32 58 L40 48" fill="none" stroke="#f8fafc" stroke-width="2.5"/>`;
    } else if (c.outfit === 'SUIT_BOWTIE_RED') {
      outfitSvg = `<path d="M10 58 Q32 45 54 58 L58 64 L6 64 Z" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/><polygon points="27,52 37,56 37,52 27,56" fill="#ef4444"/>`;
    } else if (c.outfit === 'SUIT_TIE_BLUE') {
      outfitSvg = `<path d="M10 58 Q32 45 54 58 L58 64 L6 64 Z" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/><polygon points="30,50 34,50 35,62 29,62" fill="#38bdf8"/>`;
    } else if (c.outfit === 'HOODIE_PURPLE') {
      outfitSvg = `<path d="M8 58 Q32 44 56 58 L58 64 L6 64 Z" fill="#6b21a8" stroke="#c084fc" stroke-width="1.5"/><line x1="27" y1="51" x2="27" y2="61" stroke="#e9d5ff" stroke-width="1.8"/><line x1="37" y1="51" x2="37" y2="61" stroke="#e9d5ff" stroke-width="1.8"/>`;
    } else if (c.outfit === 'HOODIE_BLACK') {
      outfitSvg = `<path d="M8 58 Q32 44 56 58 L58 64 L6 64 Z" fill="#0f172a" stroke="#64748b" stroke-width="1.5"/><line x1="27" y1="51" x2="27" y2="61" stroke="#f43f5e" stroke-width="1.8"/><line x1="37" y1="51" x2="37" y2="61" stroke="#f43f5e" stroke-width="1.8"/>`;
    } else if (c.outfit === 'VEST_KHAKI') {
      outfitSvg = `<path d="M10 58 Q32 45 54 58 L58 64 L6 64 Z" fill="#3f6212" stroke="#a3e635" stroke-width="1.5"/><rect x="18" y="53" width="8" height="7" rx="1" fill="#65a30d"/><rect x="38" y="53" width="8" height="7" rx="1" fill="#65a30d"/>`;
    } else if (c.outfit === 'JACKET_ORANGE') {
      outfitSvg = `<path d="M10 58 Q32 45 54 58 L58 64 L6 64 Z" fill="#c2410c" stroke="#fb923c" stroke-width="1.5"/><line x1="32" y1="48" x2="32" y2="64" stroke="#fde047" stroke-width="2"/>`;
    } else if (c.outfit === 'ROYAL_PURPLE') {
      outfitSvg = `<path d="M8 58 Q32 44 56 58 L58 64 L6 64 Z" fill="#4c1d95" stroke="#fbbf24" stroke-width="2"/><circle cx="32" cy="56" r="4.5" fill="#fbbf24"/>`;
    } else if (c.outfit === 'SILK_RED') {
      outfitSvg = `<path d="M8 58 Q32 44 56 58 L58 64 L6 64 Z" fill="#be185d" stroke="#f472b6" stroke-width="2"/><circle cx="32" cy="55" r="3.5" fill="#fde047"/>`;
    } else if (c.outfit === 'CHEF_WHITE') {
      outfitSvg = `<path d="M10 58 Q32 45 54 58 L58 64 L6 64 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/><circle cx="28" cy="55" r="1.5" fill="#334155"/><circle cx="36" cy="55" r="1.5" fill="#334155"/>`;
    } else {
      outfitSvg = `<path d="M10 58 Q32 45 54 58 L58 64 L6 64 Z" fill="#78350f" stroke="#d97706" stroke-width="1.5"/>`;
    }

    // 2. 얼굴 베이스
    const headSvg = `<circle cx="32" cy="34" r="14" fill="${c.skin || '#fde68a'}" stroke="#1e293b" stroke-width="1.8"/>`;

    // 3. 눈 & 안경 레이어
    let eyesSvg = '';
    if (c.eyes === 'MONOCLE_LEFT') {
      eyesSvg = `
        <circle cx="26" cy="32" r="4.8" fill="rgba(56,189,248,0.2)" stroke="#fbbf24" stroke-width="2"/>
        <line x1="21" y1="34" x2="18" y2="44" stroke="#fbbf24" stroke-width="1.3"/>
        <circle cx="26" cy="32" r="1.6" fill="#0f172a"/>
        <circle cx="38" cy="32" r="1.8" fill="#0f172a"/>
      `;
    } else if (c.eyes === 'ROUND_GLASSES') {
      eyesSvg = `
        <circle cx="26" cy="32" r="4.5" fill="rgba(255,255,255,0.2)" stroke="#334155" stroke-width="2"/>
        <circle cx="38" cy="32" r="4.5" fill="rgba(255,255,255,0.2)" stroke="#334155" stroke-width="2"/>
        <line x1="30.5" y1="32" x2="33.5" y2="32" stroke="#334155" stroke-width="2"/>
        <circle cx="26" cy="32" r="1.5" fill="#0f172a"/>
        <circle cx="38" cy="32" r="1.5" fill="#0f172a"/>
      `;
    } else if (c.eyes === 'HORN_GLASSES') {
      eyesSvg = `
        <rect x="20.5" y="28" width="10" height="7.5" rx="1.5" fill="rgba(15,23,42,0.12)" stroke="#0f172a" stroke-width="2.6"/>
        <rect x="33.5" y="28" width="10" height="7.5" rx="1.5" fill="rgba(15,23,42,0.12)" stroke="#0f172a" stroke-width="2.6"/>
        <line x1="30.5" y1="31.5" x2="33.5" y2="31.5" stroke="#0f172a" stroke-width="2.6"/>
        <circle cx="25.5" cy="32" r="1.5" fill="#0f172a"/>
        <circle cx="38.5" cy="32" r="1.5" fill="#0f172a"/>
      `;
    } else if (c.eyes === 'RED_GLASSES') {
      eyesSvg = `
        <polygon points="20,28 31,29 30,35 21,35" fill="rgba(244,63,94,0.18)" stroke="#e11d48" stroke-width="2.2"/>
        <polygon points="33,29 44,28 43,35 34,35" fill="rgba(244,63,94,0.18)" stroke="#e11d48" stroke-width="2.2"/>
        <line x1="31" y1="31" x2="33" y2="31" stroke="#e11d48" stroke-width="2"/>
        <circle cx="26" cy="32" r="1.5" fill="#0f172a"/>
        <circle cx="38" cy="32" r="1.5" fill="#0f172a"/>
      `;
    } else if (c.eyes === 'SUNGLASSES_GOLD') {
      eyesSvg = `
        <rect x="20" y="28.5" width="11" height="7" rx="2" fill="#0f172a" stroke="#fbbf24" stroke-width="2"/>
        <rect x="33" y="28.5" width="11" height="7" rx="2" fill="#0f172a" stroke="#fbbf24" stroke-width="2"/>
        <line x1="31" y1="31" x2="33" y2="31" stroke="#fbbf24" stroke-width="2"/>
      `;
    } else if (c.eyes === 'SUNGLASSES_DARK') {
      eyesSvg = `
        <rect x="20" y="28.5" width="24" height="6.8" rx="2" fill="#090d16" stroke="#38bdf8" stroke-width="1.5"/>
        <line x1="23" y1="30.5" x2="29" y2="30.5" stroke="#38bdf8" stroke-width="1.2"/>
      `;
    } else if (c.eyes === 'SMILE_EYES') {
      eyesSvg = `
        <path d="M23 32 Q26 28 29 32" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M35 32 Q38 28 41 32" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round"/>
      `;
    } else {
      // SHARP_EYES
      eyesSvg = `
        <line x1="22" y1="29" x2="29" y2="31" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
        <line x1="42" y1="29" x2="35" y2="31" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
        <circle cx="26" cy="32.5" r="1.8" fill="#0f172a"/>
        <circle cx="38" cy="32.5" r="1.8" fill="#0f172a"/>
      `;
    }

    // 4. 수염 레이어
    let beardSvg = '';
    if (c.beard === 'LONG_WHITE') {
      beardSvg = `
        <path d="M24 41 Q32 45 40 41 L37 59 Q32 63 27 59 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2"/>
        <path d="M25 39 Q32 36 39 39" fill="none" stroke="#e2e8f0" stroke-width="2.5" stroke-linecap="round"/>
      `;
    } else if (c.beard === 'LONG_GRAY') {
      beardSvg = `
        <path d="M24 41 Q32 45 40 41 L36 58 Q32 62 28 58 Z" fill="#94a3b8" stroke="#475569" stroke-width="1.2"/>
      `;
    } else if (c.beard === 'GOATEE_BLACK') {
      beardSvg = `
        <polygon points="28,43 36,43 32,52" fill="#0f172a"/>
        <path d="M27 39 Q32 37 37 39" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
      `;
    } else if (c.beard === 'MUSTACHE_CURL') {
      beardSvg = `
        <path d="M21 39 Q26 42 32 38 Q38 42 43 39" fill="none" stroke="#1e293b" stroke-width="2.8" stroke-linecap="round"/>
        <circle cx="21" cy="38.5" r="1.4" fill="#1e293b"/>
        <circle cx="43" cy="38.5" r="1.4" fill="#1e293b"/>
      `;
    } else if (c.beard === 'MUSTACHE_FLAT') {
      beardSvg = `
        <rect x="24" y="37.5" width="16" height="4" rx="1.5" fill="#1e293b"/>
      `;
    } else if (c.beard === 'MUSTACHE_THIN') {
      beardSvg = `
        <path d="M24 39 Q32 36.5 40 39" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
      `;
    } else if (c.beard === 'FULL_BUSHY') {
      beardSvg = `
        <path d="M18 36 Q18 52 32 53 Q46 52 46 36 Q40 41 32 41 Q24 41 18 36 Z" fill="#27272a" stroke="#090d16" stroke-width="1.2"/>
        <ellipse cx="32" cy="42" rx="3.5" ry="1.8" fill="#fca5a5"/>
      `;
    } else {
      // NONE -> 미소 입모양
      beardSvg = `<path d="M28 40 Q32 43.5 36 40" fill="none" stroke="#be123c" stroke-width="2" stroke-linecap="round"/>`;
    }

    // 5. 모자 레이어
    let hatSvg = '';
    if (c.hat === 'GAT_BLACK' || c.hat === 'GAT_RED_STRING') {
      hatSvg = `
        <rect x="22" y="7" width="20" height="12" rx="3" fill="#0f172a" stroke="#475569" stroke-width="1.4"/>
        <ellipse cx="32" cy="19" rx="26" ry="4" fill="#0f172a" stroke="#64748b" stroke-width="1.4"/>
        ${c.hat === 'GAT_RED_STRING' ? `<path d="M20 20 Q32 48 44 20" fill="none" stroke="#ef4444" stroke-width="1.6" stroke-dasharray="2,1"/>` : ''}
      `;
    } else if (c.hat === 'FEDORA_BROWN') {
      hatSvg = `
        <path d="M19 20 L23 8 Q32 11 41 8 L45 20 Z" fill="#78350f" stroke="#b45309" stroke-width="1.4"/>
        <rect x="20" y="16.5" width="24" height="3" fill="#ef4444"/>
        <ellipse cx="32" cy="20" rx="22" ry="3.5" fill="#78350f" stroke="#b45309" stroke-width="1.4"/>
      `;
    } else if (c.hat === 'FEDORA_BLACK') {
      hatSvg = `
        <path d="M19 20 L23 8 Q32 11 41 8 L45 20 Z" fill="#18181b" stroke="#52525b" stroke-width="1.4"/>
        <rect x="20" y="16.5" width="24" height="3" fill="#fbbf24"/>
        <ellipse cx="32" cy="20" rx="22" ry="3.5" fill="#18181b" stroke="#52525b" stroke-width="1.4"/>
      `;
    } else if (c.hat === 'BEANIE_RED') {
      hatSvg = `
        <path d="M17 24 Q17 8 32 8 Q47 8 47 24 Z" fill="#e11d48" stroke="#fda4af" stroke-width="1.4"/>
        <rect x="16" y="20" width="32" height="5" rx="2" fill="#be123c"/>
        <circle cx="32" cy="7" r="3" fill="#fda4af"/>
      `;
    } else if (c.hat === 'BEANIE_MINT') {
      hatSvg = `
        <path d="M17 24 Q17 8 32 8 Q47 8 47 24 Z" fill="#0d9488" stroke="#5eead4" stroke-width="1.4"/>
        <rect x="16" y="20" width="32" height="5" rx="2" fill="#115e59"/>
        <circle cx="32" cy="7" r="3" fill="#5eead4"/>
      `;
    } else if (c.hat === 'CAP_BLUE') {
      hatSvg = `
        <path d="M17 22 Q17 9 32 9 Q46 9 46 22 Z" fill="#2563eb" stroke="#93c5fd" stroke-width="1.4"/>
        <path d="M16 21 L54 21 Q55 24 46 24 L16 24 Z" fill="#1d4ed8"/>
      `;
    } else if (c.hat === 'CAP_YELLOW') {
      hatSvg = `
        <path d="M17 22 Q17 9 32 9 Q46 9 46 22 Z" fill="#eab308" stroke="#fef08a" stroke-width="1.4"/>
        <path d="M16 21 L54 21 Q55 24 46 24 L16 24 Z" fill="#ca8a04"/>
      `;
    } else if (c.hat === 'CROWN_GOLD') {
      hatSvg = `
        <polygon points="17,22 19,9 26,16 32,7 38,16 45,9 47,22" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/>
        <circle cx="32" cy="15" r="2.2" fill="#ef4444"/>
      `;
    } else if (c.hat === 'TIARA_SILVER') {
      hatSvg = `
        <polygon points="19,22 23,12 28,17 32,9 36,17 41,12 45,22" fill="#e2e8f0" stroke="#38bdf8" stroke-width="1.5"/>
        <circle cx="32" cy="15" r="2.2" fill="#ec4899"/>
      `;
    } else if (c.hat === 'HEADBAND_RED') {
      hatSvg = `
        <path d="M18 19 L22 10 L27 17 L32 9 L37 17 L42 10 L46 19 Z" fill="#18181b"/>
        <rect x="17" y="18" width="30" height="5" rx="2" fill="#ef4444"/>
        <polygon points="46,19 54,16 52,22" fill="#ef4444"/>
      `;
    } else if (c.hat === 'BANDANA_WHITE') {
      hatSvg = `
        <path d="M17 22 Q32 8 47 22 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
        <circle cx="47" cy="21" r="2.5" fill="#e2e8f0"/>
      `;
    }

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 64 64" class="tycoon-cust-avatar-svg" style="overflow:visible; filter:drop-shadow(0 3px 6px rgba(0,0,0,0.45));">
        <circle cx="32" cy="34" r="29" fill="rgba(15, 23, 42, 0.85)" stroke="${c.accent || '#38bdf8'}" stroke-width="2"/>
        ${outfitSvg}
        ${headSvg}
        ${eyesSvg}
        ${beardSvg}
        ${hatSvg}
      </svg>
    `;
  }
}

window.KSool.TycoonCustomerPool = TycoonCustomerPool;
