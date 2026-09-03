import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const filePath = join(ROOT, 'content/events.json');
const data = JSON.parse(readFileSync(filePath, 'utf8'));

// 1. 기업 공식 홈페이지 매핑
const COMPANY_URLS = {
  'Exxon & Mobil': [
    { name: 'ExxonMobil', url: 'https://corporate.exxonmobil.com' },
    { name: 'Mobil', url: 'https://corporate.exxonmobil.com' }
  ],
  'Intel': 'https://www.intel.com',
  'Schlumberger': 'https://www.slb.com',
  'Apple': 'https://www.apple.com',
  'Microsoft': 'https://www.microsoft.com',
  'Cisco Systems': 'https://www.cisco.com',
  'Qualcomm': 'https://www.qualcomm.com',
  'Yahoo!': 'https://www.yahoo.com',
  'eBay': 'https://www.ebay.com',
  'Amazon': 'https://www.aboutamazon.com',
  'Google': 'https://about.google',
  'Alphabet': 'https://abc.xyz',
  'RIM (블랙베리)': 'https://www.blackberry.com',
  'Tesla': 'https://www.tesla.com',
  'Nvidia': 'https://www.nvidia.com',
  'Occidental & Chevron': [
    { name: 'Occidental', url: 'https://www.oxy.com' },
    { name: 'Chevron', url: 'https://www.chevron.com' }
  ],
  'Enphase Energy': 'https://enphase.com',
  'Broadcom': 'https://www.broadcom.com',
  'Meta': 'https://about.meta.com',
  'IBM': 'https://www.ibm.com',
  'Xerox': 'https://www.xerox.com',
  'Polaroid': 'https://www.polaroid.com',
  'Eastman Kodak': 'https://www.kodak.com',
  'General Electric': 'https://www.geaerospace.com',
  'Procter & Gamble': 'https://us.pg.com',
  'ExxonMobil': 'https://corporate.exxonmobil.com',
  'Pfizer': 'https://www.pfizer.com',
  'Citigroup': 'https://www.citigroup.com',
  'Citigroup & Bank of America': [
    { name: 'Citigroup', url: 'https://www.citigroup.com' },
    { name: 'Bank of America', url: 'https://www.bankofamerica.com' }
  ],
  'JPMorgan Chase': 'https://www.jpmorganchase.com',
  'Johnson & Johnson': 'https://www.jnj.com',
  'Berkshire Hathaway': 'https://www.berkshirehathaway.com',
  'UnitedHealth': 'https://www.unitedhealthgroup.com',
  'Eli Lilly': 'https://www.lilly.com',
  'GE Aerospace': 'https://www.geaerospace.com',
  'Caterpillar': 'https://www.caterpillar.com',
  '삼환기업': 'http://www.samwhan.co.kr',
  '현대건설': 'https://www.hdec.kr',
  '대림산업': 'https://www.dlenc.co.kr',
  '삼립식품': 'https://spcsamlip.co.kr',
  '유한양행': 'https://www.yuhan.co.kr',
  '금융·무역·건설 트로이카': 'https://www.posco.com',
  '포항제철': 'https://www.posco.com',
  '태평양화학(아모레)': 'https://www.apgroup.com',
  '한국이동통신': 'https://www.sktelecom.com',
  '삼성전자': 'https://www.samsung.com/sec/',
  '삼성물산': 'https://www.samsungcnt.com',
  'LG전자': 'https://www.lge.co.kr',
  '현대중공업': 'https://www.hd-hyundai.co.kr',
  'POSCO': 'https://www.posco.com',
  '현대미포조선': 'https://www.hmd.co.kr',
  '두산중공업': 'https://www.doosanenerbility.com',
  '현대차': 'https://www.hyundai.com',
  'KT&G': 'https://www.ktng.com',
  '현대차 & 기아': [
    { name: '현대차', url: 'https://www.hyundai.com' },
    { name: '기아', url: 'https://www.kia.com' }
  ],
  'LG화학': 'https://www.lgchem.com',
  'SK이노베이션 & S-Oil': [
    { name: 'SK이노베이션', url: 'https://www.skinnovation.com' },
    { name: 'S-Oil', url: 'https://www.s-oil.com' }
  ],
  '씨젠': 'https://www.seegene.co.kr',
  '신풍제약': 'https://www.shinpoong.co.kr',
  'SK하이닉스': 'https://www.skhynix.com',
  '카카오 & NAVER': [
    { name: '카카오', url: 'https://www.kakaocorp.com' },
    { name: 'NAVER', url: 'https://www.navercorp.com' }
  ],
  'LG에너지솔루션·삼성SDI': [
    { name: 'LG에너지솔루션', url: 'https://www.lgensol.com' },
    { name: '삼성SDI', url: 'https://www.samsungsdi.co.kr' }
  ],
  '삼성바이오로직스·셀트리온': [
    { name: '삼성바이오로직스', url: 'https://samsungbiologics.com' },
    { name: '셀트리온', url: 'https://www.celltrion.com' }
  ],
  '한화에어로스페이스': 'https://www.hanwhaaerospace.co.kr',
  '한화솔루션': 'https://www.hanwhasolutions.com',
  '한미반도체': 'https://www.hanmisemi.com',
  '삼양식품': 'https://www.samyangfoods.com',
  '기업은행': 'https://www.ibk.co.kr',
  '새롬기술': 'https://www.solborn.co.kr',
  '다음(Daum)': 'https://www.daum.net',
  '한글과컴퓨터': 'https://www.hancom.com',
  '골드뱅크': 'https://ko.wikipedia.org/wiki/%EA%B3%A8%EB%93%9C%EB%B1%85%ED%81%AC',
  'NHN (네이버)': 'https://www.navercorp.com',
  '메가스터디': 'https://www.megastudy.net',
  '서울반도체': 'http://www.seoulsemicon.com',
  '셀트리온': 'https://www.celltrion.com',
  '바이로메드(헬릭스미스)': 'https://www.helixmith.com',
  '메디톡스': 'https://www.medytox.com',
  '수젠텍 & EDGC': [
    { name: '수젠텍', url: 'https://sugentech.com' },
    { name: 'EDGC', url: 'https://www.edgc.com' }
  ],
  '셀트리온헬스케어 & 제약': [
    { name: '셀트리온', url: 'https://www.celltrion.com' }
  ],
  '에코프로비엠 & 엘앤에프': [
    { name: '에코프로비엠', url: 'https://www.ecoprobm.co.kr' },
    { name: '엘앤에프', url: 'http://www.landf.co.kr' }
  ],
  '카카오게임즈 & 펄어비스': [
    { name: '카카오게임즈', url: 'https://www.kakaogamescorp.com' },
    { name: '펄어비스', url: 'https://www.pearlabyss.com' }
  ],
  '클래시스 & 휴젤': [
    { name: '클래시스', url: 'https://www.classys.com' },
    { name: '휴젤', url: 'https://www.hugel.co.kr' }
  ],
  'JYP Ent.': 'https://www.jype.com',
  '에코프로': 'https://www.ecopro.co.kr',
  '에코프로비엠': 'https://www.ecoprobm.co.kr',
  '포스코DX': 'https://www.poscodx.com',
  '레인보우로보틱스': 'https://www.rainbow-robotics.com'
};

// leaders에 url/links 주입
(data.markets || []).forEach(m => {
  (m.turningPoints || []).forEach(tp => {
    (tp.leaders || []).forEach(l => {
      const match = COMPANY_URLS[l.name];
      if (typeof match === 'string') {
        l.url = match;
      } else if (Array.isArray(match)) {
        l.url = match[0].url;
        l.links = match;
      }
    });
  });
});

// 2. 48개 사건별 주가 및 시장 영향(Market Impact) 상세 매핑
const IMPACTS = {
  '1955-05': {
    type: 'rally',
    tag: '🚀 전후 경제 호황',
    summary: '냉전 블록 고착화 속 미국 전후 제조업 및 소비재 주도 NYSE 대세 상승장 전개.',
    detail: '아이젠하워 행정부 시기 냉전 국방 지출과 고속도로 건설 등 인프라 투자가 맞물려 미국 다우·NYSE 지수가 강세를 구가했습니다.'
  },
  '1956-10': {
    type: 'shock',
    tag: '📉 지정학·원자재 쇼크',
    summary: '수에즈 운하 봉쇄로 원유 수송 차질 우려 발생, 글로벌 증시 단기 변동성 확대.',
    detail: '중동 산유국과 유럽 간 원유 공급망 위협으로 해운·정유주는 급등한 반면 일반 제조업 지수는 일시 조정을 겪었습니다.'
  },
  '1957-10': {
    type: 'rally',
    tag: '🚀 기술 경쟁 점화',
    summary: '스푸트니크 쇼크로 미국 우주항공·방산·전자주에 전례 없는 정부 R&D 투자 유입.',
    detail: '소련의 위성 발사 성공은 미국 NASA 창설과 국방과학 예산 폭증으로 이어져 하이테크 방산주 랠리의 모태가 되었습니다.'
  },
  '1958-12': {
    type: 'volatility',
    tag: '📊 원조경제 혼란',
    summary: '정치적 긴장 고조 속 전후 원조 물자 의존형 한국 초기 삼백산업(제분·제당·면방직) 변동성.',
    detail: '대한증권거래소 설립 초기 미성숙한 시장 환경에서 정치 불안이 자금 조달에 제약을 가했습니다.'
  },
  '1960-04': {
    type: 'reform',
    tag: '🏛️ 체제 전환 전야',
    summary: '이승만 정권 붕괴와 민주화 열망 속 극심한 경제 혼란 및 환율 급변동.',
    detail: '정치적 격변으로 실물 경제가 일시 마비되었으나 향후 근대화 경제개발계획의 기반이 태동하는 계기가 되었습니다.'
  },
  '1961-05': {
    type: 'reform',
    tag: '🏛️ 국가주도 경제 개막',
    summary: '군사정부 수립 및 경제개발 5개년 계획 발표, 화폐개혁과 1962 증권파동의 도화선.',
    detail: '국가 주도형 수출 공업화가 시작되며 건설·제조업 중심으로 한국 자본시장의 기틀이 마련되기 시작했습니다.'
  },
  '1962-10': {
    type: 'shock',
    tag: '📉 핵전쟁 공포 저점',
    summary: '미·소 핵전쟁 위기로 월가 패닉 셀링, 사태 타결 후 V자 급반등.',
    detail: '쿠바 해상 봉쇄 기간 동안 급락했던 NYSE는 케네디와 흐루쇼프의 극적 타결 직후 역사적 저점을 찍고 1960년대 중반 강세장으로 직행했습니다.'
  },
  '1963-11': {
    type: 'volatility',
    tag: '📊 단기 충격 흡수',
    summary: '케네디 대통령 암살 당일 미 증시 조기 폐장, 존슨 정부 출범 후 신속한 안도 랠리.',
    detail: '정치적 비극에 따른 단기 패닉은 다음날 린든 존슨의 안정적인 권력 승계와 감세 정책 기조로 빠르게 회복되었습니다.'
  },
  '1965-06': {
    type: 'rally',
    tag: '🚀 대규모 자본 유입',
    summary: '대일 청구권 자금 유입으로 포항제철·경부고속도로 등 한국 기간산업 투자 폭발.',
    detail: '정치적 반대 속에서도 5억 달러의 유무상 자금이 유입되며 한국 중화학공업 상장사들의 비약적 도약 발판이 마련되었습니다.'
  },
  '1966-03': {
    type: 'rally',
    tag: '🚀 베트남 특수 호황',
    summary: '베트남전 참전과 브라운 각서로 막대한 외화 획득 및 건설·수송·무역 특수 개막.',
    detail: '현대건설, 한진 등 한국 1세대 대기업들이 베트남 전선에서 자본과 시공 경험을 축적하며 성장의 전기를 마련했습니다.'
  },
  '1967-07': {
    type: 'volatility',
    tag: '📊 공안 정국 긴장',
    summary: '동베를린 간첩단 사건 등 냉전 안보 위협 속에서도 제2차 경제개발계획 수출 드라이브 지속.',
    detail: '남북 긴장이 시장 심리를 억눌렀으나 차관 도입에 따른 섬유·경공업 수출 증가세가 주가 하방을 지지했습니다.'
  },
  '1969-07': {
    type: 'rally',
    tag: '🚀 우주·전자 기술 혁신',
    summary: '아폴로 11호 달 착륙 성공으로 미국 반도체·전자·우주항공주(Nifty Fifty) 전성기 진입.',
    detail: '집적회로(IC)와 메인프레임 컴퓨터의 폭발적 보급으로 IBM, 제록스, 모토로라 등이 미 증시의 절대적 주도주로 군림했습니다.'
  },
  '1972-02': {
    type: 'rally',
    tag: '🌐 데탕트·무역로 개척',
    summary: '미·중 수교 화해 모드로 글로벌 지정학 리스크 완화 및 세계 교역 확대 기대감.',
    detail: '냉전 해체 조짐과 1971년 나스닥 출범 초기 IT·혁신 기업들의 자금 조달 활성화가 맞물렸습니다.'
  },
  '1973-10': {
    type: 'stagflation',
    tag: '⚖️ 1차 오일쇼크 폭락',
    summary: '원유 가격 4배 폭등, S&P 500 -48%·나스닥 -60% 폭락하며 역사상 최악의 스태그플레이션.',
    detail: '아랍 산유국의 석유 무기화로 비용 인플레이션이 폭발하며 전 세계 증시가 2년간 장기 침체에 빠졌습니다.'
  },
  '1975-04': {
    type: 'volatility',
    tag: '📊 냉전 지형 재편',
    summary: '베트남 공산화로 아시아 안보 리스크 고조, 한국은 중동 건설 붐으로 오일달러 흡수 전환.',
    detail: '동남아 도미노 우려 속에서도 삼환기업·현대건설 등 한국 건설사들이 사우디 등 중동 플랜트를 대거 수주하며 오일머니를 유치했습니다.'
  },
  '1976-08': {
    type: 'shock',
    tag: '📉 한반도 전쟁 위기',
    summary: '판문점 도끼만행으로 워싱턴·서울 데프콘 3 발령, 코리아 디스카운트 단기 부각.',
    detail: '일촉즉발의 전면전 위기로 장중 채권·주식 시장이 경색되었으나 미군의 단호한 대응 후 진정 국면으로 전환되었습니다.'
  },
  '1977-12': {
    type: 'rally',
    tag: '🚀 수출 100억 달러 금자탑',
    summary: '한국 수출 100억 달러 돌파, 중화학공업화 성공으로 상장 제조기업 이익 폭발.',
    detail: '조선·철강·전자 업종의 해외 진출이 본격화되며 국내 주식시장의 규모와 유동성이 한 단계 레벨업되었습니다.'
  },
  '1979-10': {
    type: 'stagflation',
    tag: '⚖️ 2차 오일쇼크 & 국변',
    summary: '박정희 대통령 서거와 2차 석유파동 겹악재로 1980년 한국 경제 최초 역성장(-1.7%).',
    detail: '미국 연준 폴 볼커의 20% 초고금리 긴축과 국내 정치 공백이 맞물려 증시가 심각한 자금난을 겪었습니다.'
  },
  '1980-05': {
    type: 'shock',
    tag: '📉 정치 격변·신군부 집권',
    summary: '5·18 민주화운동과 비상계엄 전국 확대로 경제 심리 위축, KOSPI 100p 기준지수 출범 전야.',
    detail: '정치 불안정 속에서도 중화학공업 투자 조정과 기업 통폐합 등 구조조정이 이어지며 1980년대 초 시장 재편이 시작되었습니다.'
  },
  '1981-09': {
    type: 'rally',
    tag: '🚀 올림픽 호재 & 경기 부양',
    summary: '88 서울올림픽 유치 성공으로 인프라·레저·건설주 기대감 고조, 대외 인지도 제고.',
    detail: '글로벌 경기 회복 조짐과 함께 국내 자본시장 개방 계획이 발표되며 장기 상승 기반이 구축되었습니다.'
  },
  '1983-10': {
    type: 'shock',
    tag: '📉 대북 안보 패닉',
    summary: '버마 아웅산 묘소 테러로 경제 부처 각료 대거 순국, 지정학적 위험 최고조.',
    detail: '서석준 부총리, 김재익 경제수석 등 경제 정책 브레인 상실 충격으로 증시가 일시 요동쳤으나 규제 완화 기조는 유지되었습니다.'
  },
  '1985-09': {
    type: 'rally',
    tag: '🚀 플라자 합의 & 3저 호황',
    summary: '달러 약세·엔고 유도로 한국 수출 경쟁력 극대화, 코스피 사상 첫 대세상승 시작.',
    detail: '저유가·저금리·저원화의 3저 호황을 타고 무역수지가 사상 첫 흑자로 전환되며 KOSPI 1,000p 시대를 여는 불씨가 되었습니다.'
  },
  '1986-04': {
    type: 'volatility',
    tag: '📊 원전·에너지주 재평가',
    summary: '체르노빌 원전 폭발로 원자력 산업 위축, 신재생·대체에너지 및 유럽 농업주 파장.',
    detail: '반면 글로벌 주식시장은 유가 하락과 저금리에 힘입어 1980년대 중반 유동성 장세를 이어갔습니다.'
  },
  '1987-06': {
    type: 'volatility',
    tag: '📊 민주화 & 블랙먼데이',
    summary: '6월 항쟁으로 민주화 달성, 10월에는 월가 블랙먼데이(-22.6%) 쇼크 전이.',
    detail: '국내 임금 인상과 노사분규 속에서도 3저 호황에 힘입어 KOSPI는 500선을 돌파하며 미국발 블랙먼데이 충격을 상대적으로 잘 방어했습니다.'
  },
  '1988-09': {
    type: 'rally',
    tag: '🚀 88 올림픽 & 트로이카 장세',
    summary: '서울올림픽 개최로 국가 브랜드 격상, 금융·무역·건설 트로이카 폭등 장세.',
    detail: '시중 유동성이 주식시장으로 대거 유입되며 주식 계좌 수가 폭증했고, 코스피는 마침내 1989년 1,000p 고지에 도달했습니다.'
  },
  '1989-11': {
    type: 'rally',
    tag: '🌐 냉전 종식·동구권 개방',
    summary: '베를린 장벽 붕괴로 동유럽 시장 열리고 평화의 배당금(Peace Dividend) 수혜.',
    detail: '국방비 감축에 따른 재정 건전화와 글로벌 무역 확대 기대감으로 다우 및 유럽 증시가 장기 랠리에 시동을 걸었습니다.'
  },
  '1991-12': {
    type: 'reform',
    tag: '🏛️ 글로벌 자본시장 개방',
    summary: '소련 해체로 글로벌 단일 시장화 촉진, 1992년 한국 주식시장 외국인 직접투자 허용.',
    detail: '외국인 자금 유입이 시작되며 삼성전자, 포항제철 등 한국 대표 우량주(Blue Chip)의 가치 재평가가 시작되었습니다.'
  },
  '1993-02': {
    type: 'reform',
    tag: '🏛️ 금융실명제 전격 단행',
    summary: '문민정부의 금융실명제 발표로 지하경제 자금 양성화, 단기 충격 후 투명성 프리미엄.',
    detail: '발표 초기 주가가 급락했으나 차명 거래가 근절되고 자본시장의 공정성이 확립되며 코스피 1,000선 재탈환의 디딤돌이 되었습니다.'
  },
  '1994-07': {
    type: 'shock',
    tag: '📉 북핵 1차 위기·김일성 사망',
    summary: '영변 핵시설 타격 검토 및 김일성 급사로 한반도 전쟁 공포 극대화, 단기 패닉.',
    detail: '외국인 매도세로 일시 조정받았으나 카터 방북과 제네바 합의로 리스크가 봉합되며 반도체 호황에 힘입어 반등했습니다.'
  },
  '1997-11': {
    type: 'shock',
    tag: '📉 국가 부도 IMF 외환위기',
    summary: '외환보유고 고갈로 구제금융 신청, 환율 2,000원 육박·코스피 280선 폭락.',
    detail: '대기업과 금융권 연쇄 부도로 코스피가 -60% 이상 추락했으나, 가혹한 구조조정 후 벤처IT 혁명의 토양을 낳았습니다.'
  },
  '2000-06': {
    type: 'volatility',
    tag: '📊 대북 테마 vs 닷컴 버블 붕괴',
    summary: '첫 남북정상회담으로 남북경협주 폭등, 그러나 글로벌 닷컴 버블 붕괴로 지수 폭락.',
    detail: '나스닥이 5,000선에서 -78% 폭락하는 과정에서 코스닥도 2,800선에서 500선으로 붕괴하며 극심한 옥석 가리기가 진행되었습니다.'
  },
  '2001-09': {
    type: 'shock',
    tag: '📉 9·11 테러 대폭락',
    summary: '뉴욕 쌍둥이 빌딩 붕괴로 월가 거래 일주일 중단, 재개 후 항공·여행·보험주 폭락.',
    detail: '글로벌 안보 위기 속에서 연준이 공격적인 초저금리 정책을 도입하여 2000년대 중반 부동산 및 원자재 붐을 잉태했습니다.'
  },
  '2002-06': {
    type: 'rally',
    tag: '🚀 월드컵 4강 & 내수 활황',
    summary: '월드컵 신화로 국가 브랜드 파워 급상승, 카드 버블 전야의 내수 소비 팽창.',
    detail: 'IT 거품 붕괴를 극복하고 삼성전자가 글로벌 반도체·모바일 1위로 도약하며 지수를 견인했습니다.'
  },
  '2003-02': {
    type: 'volatility',
    tag: '📊 카드채 사태 & 이라크전',
    summary: '신용카드 대출 부실로 카드채 위기 발발, 미국 이라크 침공으로 유가 상승 압력.',
    detail: 'SK글로벌 분식회계와 카드사 부실로 코스피가 512선까지 후퇴했으나 위기 수습 후 중국 특수 장세로 전환되었습니다.'
  },
  '2004-03': {
    type: 'shock',
    tag: '📉 대통령 탄핵소추 충격',
    summary: '헌정 사상 최초 대통령 탄핵 가결로 증시 당일 -5.5% 급락, 헌재 기각 후 정상화.',
    detail: '정치 불확실성은 단기에 그쳤으며, 브릭스(BRICs) 경제 성장과 차·화·정(자동차·화학·정유) 랠리로 상승 궤도에 복귀했습니다.'
  },
  '2007-01': {
    type: 'rally',
    tag: '🚀 모바일 스마트폰 혁명',
    summary: '스티브 잡스의 아이폰 공개로 모바일 컴퓨팅 개막, 애플·빅테크 15년 랠리 출발점.',
    detail: '글로벌 통신·인터넷 생태계가 모바일로 전환되며 애플, 구글 등이 세계 시가총액 1위를 독식하는 신호탄이 되었습니다.'
  },
  '2008-09': {
    type: 'shock',
    tag: '📉 리먼 파산·글로벌 금융위기',
    summary: '월가 4대 투자은행 리먼 브라더스 파산, S&P 500 -57%·코스피 900선 반토막 폭락.',
    detail: '서브프라임 모기지 부실이 전 세계 신용 경색을 불렀고, 사상 초유의 제로금리와 무제한 양적완화(QE) 시대가 열렸습니다.'
  },
  '2010-03': {
    type: 'volatility',
    tag: '📊 대북 리스크 & 차·화·정 랠리',
    summary: '천안함 피격으로 지정학적 긴장 고조, 반면 중국 성장 수혜로 차·화·정 주도주 급등.',
    detail: '단기 대북 리스크보다 현대차, 기아, LG화학, 정유주 중심의 실적 모멘텀이 코스피 2,000선 돌파를 주도했습니다.'
  },
  '2011-03': {
    type: 'shock',
    tag: '📉 동일본 대지진 공급망 쇼크',
    summary: '후쿠시마 원전 사고로 글로벌 반도체·자동차 부품 공급망 마비, 엔고 반사이익.',
    detail: '일본 제조시설 파괴로 한국 반도체·자동차 기업들이 글로벌 대체 수혜를 입었으나 동년 8월 미국 신용등급 강등 충격을 맞았습니다.'
  },
  '2014-04': {
    type: 'volatility',
    tag: '📊 내수 침체 & 박스피(Boxpi)',
    summary: '세월호 참사로 전 국민적 애도 분위기 속 소비 위축, 2,000선 갇힌 박스피 장세.',
    detail: '저성장·저물가 고착화와 기업 실적 둔화로 코스피가 1,800~2,050 좁은 밴드에 수년간 갇히는 박스권이 지속되었습니다.'
  },
  '2016-12': {
    type: 'reform',
    tag: '🏛️ 국정농단 탄핵 & 반도체 슈퍼사이클',
    summary: '대통령 탄핵 정국의 정치적 격변, 반면 글로벌 메모리 반도체 슈퍼사이클 진입.',
    detail: '정치적 혼란에도 불구하고 스마트폰·데이터센터 수요 폭증으로 삼성전자와 SK하이닉스가 사상 최대 실적을 경신했습니다.'
  },
  '2017-05': {
    type: 'rally',
    tag: '🚀 코스피 2,500 역사적 돌파',
    summary: '새 정부 출범과 반도체 수출 호황으로 코스피가 박스권을 뚫고 2,500선 사상 최고치 경신.',
    detail: '외국인 순매수와 주주환원 정책 확대가 맞물려 IT 및 대형 가치주 전반으로 온기가 확산되었습니다.'
  },
  '2018-02': {
    type: 'volatility',
    tag: '📊 평화 무드 vs 미·중 무역전쟁',
    summary: '평창 올림픽 남북 화해 무드 vs 트럼프의 대중 관세 폭탄으로 글로벌 증시 둔화.',
    detail: '남북 경협주가 단기 급등했으나, 미·중 패권 전쟁 본격화로 수출 의존도가 높은 한국 증시는 2018년 내내 조정받았습니다.'
  },
  '2020-03': {
    type: 'shock',
    tag: '📉 팬데믹 폭락 후 동학개미 랠리',
    summary: '코로나19 팬데믹으로 글로벌 서킷브레이커, 이후 무제한 유동성으로 코스피 3,300 돌파.',
    detail: '1,439p까지 급락했던 코스피는 개인 투자자(동학개미)의 대규모 순매수와 각국의 초저금리 유동성에 힘입어 사상 최대 랠리를 펼쳤습니다.'
  },
  '2022-02': {
    type: 'shock',
    tag: '📉 우크라이나 침공 & 금리 빅스텝',
    summary: '러시아의 침공으로 에너지·곡물 인플레이션 폭발, 미 연준의 4연속 0.75%p 금리 인상.',
    detail: '인플레이션을 잡기 위한 살인적인 긴축으로 2022년 나스닥 -33%, 코스피 -25% 급락하며 기술주 밸류에이션이 붕괴했습니다.'
  },
  '2022-11': {
    type: 'rally',
    tag: '🚀 생성형 AI & 엔비디아 혁명',
    summary: 'OpenAI ChatGPT 공개로 생성형 AI 시대 개막, 엔비디아·빅테크 주도 나스닥 사상 최고치.',
    detail: 'HBM 반도체와 AI 데이터센터 수요가 폭증하며 SK하이닉스와 빅테크가 신고가를 경신하고 증시의 새 패러다임을 형성했습니다.'
  },
  '2024-12': {
    type: 'shock',
    tag: '📉 비상계엄 쇼크 & 정치 불안',
    summary: '비상계엄 선포로 야간 환율 급등 및 코스피 변동성 폭발, 국회 해제 의결로 급진정.',
    detail: '한국의 민주주의 회복력과 시스템 안전판이 확인되었으나, 정치적 불확실성에 따른 코리아 디스카운트 해소 과제를 남겼습니다.'
  },
  '2025-06': {
    type: 'reform',
    tag: '🏛️ 지배구조 개혁 & 밸류업 도약',
    summary: '조기 대선으로 정국 안정화, 상법 개정 및 기업 밸류업 프로그램 가속화 기대감.',
    detail: '정치적 정상화와 함께 자본시장 선진화 정책이 재가동되며 한국 증시의 구조적 저평가 탈피 노력이 본격화되었습니다.'
  }
};

// events에 marketImpact 주입
data.events.forEach(ev => {
  if (IMPACTS[ev.id]) {
    ev.marketImpact = IMPACTS[ev.id];
  }
});

writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`✓ content/events.json 업데이트 완료! (48개 사건 marketImpact 및 leaders 기업 공식 홈페이지)`);
