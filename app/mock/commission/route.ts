import { NextResponse } from "next/server";

const SOURCE_ORIGIN = "https://xn--989a00af8jnslv3dba.com";
const SOURCE_URL = `${SOURCE_ORIGIN}/%EC%A4%91%EA%B0%9C%EB%B3%B4%EC%88%98`;

const ALLOWED_EXTERNAL_HOST_PATTERNS = [/(^|\.)go\.kr$/i, /(^|\.)korea\.kr$/i, /(^|\.)seoul\.go\.kr$/i, /(^|\.)gg\.go\.kr$/i];

function getRuntimeScript() {
  return `<script id="saljip-mock-runtime">
    (function(){
      function setText(selector, text){
        document.querySelectorAll(selector).forEach(function(el){ el.textContent = text; });
      }
      function setAmountTypeLabel(text){
        var el = document.getElementById('amount_type');
        if(el) el.textContent = text;
      }
      function setActive(button){
        if(!button || !button.parentElement) return;
        button.parentElement.querySelectorAll('.btn').forEach(function(b){ b.classList.remove('active'); });
        button.classList.add('active');
      }
      function show(sel){ document.querySelectorAll(sel).forEach(function(el){ el.classList.remove('d-none'); el.style.display=''; }); }
      function hide(sel){ document.querySelectorAll(sel).forEach(function(el){ el.classList.add('d-none'); el.style.display='none'; }); }
      function numberFromId(id){
        var el = document.getElementById(id);
        if(!el) return 0;
        var n = Number(el.value || 0);
        if(!Number.isFinite(n) || Number.isNaN(n)) return 0;
        return Math.max(0, n);
      }
      function checked(id){
        var el = document.getElementById(id);
        return !!(el && el.checked);
      }
      function formatManwon(value){
        var n = Number(value || 0);
        var rounded = Math.round(n * 100) / 100;
        return rounded.toLocaleString('ko-KR') + '만원';
      }
      function escapeHtml(v){
        return String(v ?? '')
          .replaceAll('&','&amp;')
          .replaceAll('<','&lt;')
          .replaceAll('>','&gt;')
          .replaceAll('"','&quot;')
          .replaceAll("'",'&#39;');
      }
      var resultsState = [];

      function formatWonFromManwon(value){
        return Math.round(Number(value || 0) * 10000).toLocaleString('ko-KR');
      }

      function showResultSections(){
        document.querySelectorAll('.hiding').forEach(function(el){ el.style.display = 'block'; });
        var basisWrap = document.getElementById('basisWrap');
        if(basisWrap) basisWrap.style.display = '';
      }

      function getAmountRowLabel(payload){
        if(payload.realEstateType === 'distribution') return '현재까지 불입금액';
        if(payload.dealType === 'lease') return '전세가';
        if(payload.dealType === 'rent') return '보증금';
        return '매매가';
      }

      function getAmountNote(payload){
        if(payload.realEstateType === 'distribution') return '입력값';
        if(payload.dealType === 'rent') return '입력값';
        return '입력값';
      }

      function renderResultRows(){
        var container = document.getElementById('resultSet');
        if(!container) return;

        var html = resultsState.map(function(row, idx){
          var limitNote = row.upperLimitManwon == null ? '한도 없음' : '구간 한도액 적용';
          var premiumValue = row.realEstateType === 'distribution' ? row.premiumManwon : 0;
          var extraLabel = row.realEstateType === 'distribution' ? '프리미엄' : (row.dealType === 'rent' ? '월세' : '추가금액');
          var extraNote = row.realEstateType === 'distribution' ? '입력값' : (row.dealType === 'rent' ? '입력값' : '-');
          var vatRatePct = (Number(row.vatRate || 0) * 100).toFixed(0);

          return '' +
            '<div id="result' + (idx + 1) + '" class="result pr-4">' +
              '<div class="page-header mb-2"><span class="h5"> 계산서 ' + (idx + 1) + '</span>&nbsp;<i class="far fa-copy click" onclick="copyTable(this)"></i>&nbsp;&nbsp;<i class="bi bi-filetype-csv click" onclick="downloadCsv(this)"></i></div>' +
              '<table class="table table-bordered tlf mb-4"><thead><tr><th>#</th><th>적요</th><th>금액</th><th class="dpLg">비고</th></tr></thead><tbody>' +
                '<tr><td>1</td><td class="적요">' + escapeHtml(getAmountRowLabel(row)) + '<div class="dpSm text-muted small">' + escapeHtml(getAmountNote(row)) + '</div></td><td class="금액">' + formatWonFromManwon(row.amountManwon) + '</td><td class="비고 dpLg">' + escapeHtml(getAmountNote(row)) + '</td></tr>' +
                '<tr><td>2</td><td class="적요">' + escapeHtml(extraLabel) + '<div class="dpSm text-muted small">' + escapeHtml(extraNote) + '</div></td><td class="금액">' + formatWonFromManwon(extraLabel === '월세' ? row.rentManwon : premiumValue) + '</td><td class="비고 dpLg">' + escapeHtml(extraNote) + '</td></tr>' +
                '<tr><td>3</td><td class="적요">거래가격<div class="dpSm text-muted small">기준가격(불입금액 + 프리미엄)</div></td><td class="금액">' + formatWonFromManwon(row.transactionAmountManwon) + '</td><td class="비고 dpLg">기준가격(불입금액 + 프리미엄)</td></tr>' +
                '<tr><td>4</td><td class="적요">상한 요율<div class="dpSm text-muted small">' + escapeHtml(row.basisText) + '</div></td><td class="금액">' + escapeHtml(row.rateLabel) + '</td><td class="비고 dpLg">' + escapeHtml(row.basisText) + '</td></tr>' +
                '<tr><td>5</td><td class="적요">한도액<div class="dpSm text-muted small">' + escapeHtml(limitNote) + '</div></td><td class="금액">' + (row.upperLimitManwon == null ? '없음' : formatWonFromManwon(row.upperLimitManwon)) + '</td><td class="비고 dpLg">' + escapeHtml(limitNote) + '</td></tr>' +
                '<tr style="background-color:#eeefff; font-weight:bold"><td>6</td><td class="적요">중개 수수료<div class="dpSm text-muted small">min(기준금액 × 요율, 한도액)</div></td><td class="금액">' + formatWonFromManwon(row.commissionManwon) + '</td><td class="비고 dpLg">min(기준금액 × 요율, 한도액)</td></tr>' +
                '<tr style="font-weight:bold"><td>7</td><td class="적요">부가세 포함<div class="dpSm text-muted small">VAT ' + vatRatePct + '%(' + formatWonFromManwon(row.vatManwon) + ') 포함</div></td><td class="금액">' + formatWonFromManwon(row.totalManwon) + '</td><td class="비고 dpLg">VAT ' + vatRatePct + '%(' + formatWonFromManwon(row.vatManwon) + ') 포함</td></tr>' +
              '</tbody></table>' +
            '</div>';
        }).join('');

        container.innerHTML = html;
      }

      function renderResult(result, payload, mode){
        var enriched = {
          dealType: payload.dealType,
          realEstateType: payload.realEstateType,
          amountManwon: payload.amountManwon,
          rentManwon: payload.rentManwon,
          premiumManwon: payload.premiumManwon,
          transactionAmountManwon: result.transactionAmountManwon,
          rateLabel: result.rateLabel,
          upperLimitManwon: result.upperLimitManwon,
          commissionManwon: result.commissionManwon,
          vatRate: result.vatRate,
          vatManwon: result.vatManwon,
          totalManwon: result.totalManwon,
          basisText: result.basisText
        };

        if(mode === 'add') {
          resultsState.push(enriched);
        } else {
          resultsState = [enriched];
        }

        renderResultRows();

        var basis = document.getElementById('basis');
        if(basis) basis.innerHTML = '<p>(불입금액 + 프리미엄) × 상한 요율</p>';

        showResultSections();
      }

      window.setSale = function(target){
        var deal = document.getElementById('dealType'); if(deal) deal.value='sale';
        setAmountTypeLabel('매매가');
        hide('.rentGroup'); show('.onlySale');
        var realEstate = document.getElementById('realEstateType');
        if(realEstate && realEstate.value !== 'distribution') hide('.distGroup');
        setActive(target);
      };
      window.setLease = function(target){
        var deal = document.getElementById('dealType'); if(deal) deal.value='lease';
        setAmountTypeLabel('전세가');
        hide('.rentGroup'); hide('.distGroup'); hide('.onlySale');
        setActive(target);
      };
      window.setRent = function(target){
        var deal = document.getElementById('dealType'); if(deal) deal.value='rent';
        setAmountTypeLabel('보증금');
        show('.rentGroup'); hide('.distGroup'); hide('.onlySale');
        setActive(target);
      };
      window.setHouse = function(target){ var t=document.getElementById('realEstateType'); if(t) t.value='house'; hide('.distGroup'); setActive(target); };
      window.setOfficetel = function(target){ var t=document.getElementById('realEstateType'); if(t) t.value='officetel'; hide('.distGroup'); setActive(target); };
      window.setDistrib = function(target){ var t=document.getElementById('realEstateType'); if(t) t.value='distribution'; setAmountTypeLabel('불입금액'); show('.distGroup'); setActive(target); };
      window.setEtc = function(target){ var t=document.getElementById('realEstateType'); if(t) t.value='etc'; hide('.distGroup'); setActive(target); };
      window.doTran = function(_name, mode){
        (async function(){
          try {
            var payload = {
              dealType: (document.getElementById('dealType') || {}).value || 'sale',
              realEstateType: (document.getElementById('realEstateType') || {}).value || 'house',
              amountManwon: numberFromId('amount'),
              rentManwon: numberFromId('rent'),
              premiumManwon: numberFromId('premium'),
              customRatePct: checked('customRateCheck') ? numberFromId('customRate') : null,
              vatRatePct: checked('customVatRateYn') ? numberFromId('customVatRate') : 10
            };

            if(!payload.amountManwon){
              alert('거래금액(또는 매매가/전세가/보증금)을 입력해주세요.');
              return;
            }

            var res = await fetch('/api/commission/calc', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            var json = await res.json();
            if(!res.ok || !json.ok) throw new Error((json && json.error) || '계산 요청 실패');
            renderResult(json.result, payload, mode === 'add' ? 'add' : 'replace');
          } catch (e) {
            alert('계산 중 오류가 발생했습니다: ' + ((e && e.message) || '알 수 없는 오류'));
          }
        })();
        return false;
      };
      window.hideCol = function(selector, colIndex){
        var isVisible = !!(document.getElementById('number') && document.getElementById('number').checked);
        document.querySelectorAll(selector + ' table tr').forEach(function(tr){
          var cells = tr.children;
          if(cells && cells[colIndex - 1]) cells[colIndex - 1].style.display = isVisible ? '' : 'none';
        });
      };
      window.copyTable = function(icon){
        try {
          var table = icon && icon.closest('.result') ? icon.closest('.result').querySelector('table') : null;
          if(!table) return;
          navigator.clipboard.writeText(table.innerText || '').then(function(){ alert('표 내용이 복사되었습니다.'); });
        } catch (_) {}
      };
      window.downloadCsv = function(icon){
        try {
          var table = icon && icon.closest('.result') ? icon.closest('.result').querySelector('table') : null;
          if(!table) return;
          var rows = Array.from(table.querySelectorAll('tr')).map(function(tr){
            return Array.from(tr.querySelectorAll('th,td')).map(function(td){
              return '"' + String(td.textContent || '').replaceAll('"','""').trim() + '"';
            }).join(',');
          }).join('\\n');
          var blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'commission-result.csv';
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } catch (_) {}
      };
      window.showModalCalc = function(type){ alert('모방 단계입니다. ' + type + ' 저장은 추후 구현됩니다.'); };
      window.menuSearch = function(){};
      window.copyUrlPath = function(){};
      window.openHistoryBox = function(){};
      window.hideHistoryBox = function(){};

      document.addEventListener('DOMContentLoaded', function(){
        var customRate = document.getElementById('customRateCheck');
        if(customRate){ customRate.addEventListener('change', function(){ if(customRate.checked){ show('.customGroup'); } else { hide('.customGroup'); } }); }
        var customVat = document.getElementById('customVatRateYn');
        if(customVat){ customVat.addEventListener('change', function(){ if(customVat.checked){ show('.customVatGroup'); } else { hide('.customVatGroup'); } }); }

        var submitBtn = document.getElementById('submit');
        if(submitBtn){
          submitBtn.addEventListener('click', function(e){
            e.preventDefault();
            window.doTran('commission');
          });
        }

        var addBtn = document.getElementById('addSubmit');
        if(addBtn){
          addBtn.addEventListener('click', function(e){
            e.preventDefault();
            window.doTran('commission', 'add');
          });
        }

        document.querySelectorAll('[data-toggle="tab"]').forEach(function(tab){
          tab.addEventListener('click', function(e){
            e.preventDefault();
            var href = tab.getAttribute('href');
            if(!href || !href.startsWith('#')) return;
            document.querySelectorAll('[data-toggle="tab"]').forEach(function(t){ t.classList.remove('active','show'); });
            tab.classList.add('active','show');
            document.querySelectorAll('.tab-pane').forEach(function(p){ p.classList.remove('active','show'); });
            var pane = document.querySelector(href);
            if(pane) pane.classList.add('active','show');
          });
        });
      });
    })();
  </script>`;
}

function buildFallbackHtml() {
  const runtimeScript = getRuntimeScript();
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>살집 중개보수 계산기 (모방)</title>
  <style>
    body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f8fafc;color:#0f172a;padding-top:56px}
    .global-header{position:fixed;top:0;left:0;right:0;z-index:1040;border-bottom:1px solid #dbe4ee;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);box-shadow:0 2px 8px rgba(15,23,42,.08)}
    .global-header-inner{height:60px;max-width:1200px;margin:0 auto;padding:0 20px;display:grid;grid-template-columns:108px minmax(0,1fr) auto;align-items:center;gap:12px}
    .global-header-logo{display:inline-flex;align-items:center;gap:8px;text-decoration:none;color:#0f172a}
    .global-header-logo-mark{width:24px;height:24px;border-radius:6px;background:#0f766e;color:#fff;display:inline-flex;align-items:center;justify-content:center}
    .global-header-logo-mark svg{width:17px;height:17px;display:block}
    .global-header-logo-text{font-size:16px;font-weight:800;letter-spacing:-0.1px}
    .global-header-menu{display:flex;align-items:center;gap:16px}
    .global-header-menu-link{color:#334155;text-decoration:none;font-size:13px;font-weight:600;white-space:nowrap}
    .container{max-width:1100px;margin:0 auto;padding:16px}
    .btn-group{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}
    .btn{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:8px 12px;cursor:pointer}
    .btn.active{background:#0f766e;border-color:#0f766e;color:#fff}
    .card{border:1px solid #e2e8f0;border-radius:12px;background:#fff;padding:12px;margin-bottom:10px}
    .row{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}
    .col-12{grid-column:1 / -1}
    .col-md-6,.col-md-8{display:block}
    .mb-1{margin-bottom:4px}.mb-2{margin-bottom:8px}.mb-3{margin-bottom:12px}
    .d-inline{display:inline-block}.d-inline-block{display:inline-block}
    .mr-3{margin-right:12px}.ml-2{margin-left:8px}
    .input-group{display:flex;align-items:stretch;width:100%}
    .input-group-prepend,.input-group-append{display:flex}
    .input-group-text{display:flex;align-items:center;padding:8px 10px;border:1px solid #cbd5e1;background:#f8fafc;white-space:nowrap}
    .input-group-prepend .input-group-text{border-right:0;border-radius:8px 0 0 8px}
    .input-group-append .input-group-text{border-left:0;border-radius:0 8px 8px 0}
    .form-control{border:1px solid #cbd5e1;border-radius:0;padding:8px;width:100%;box-sizing:border-box}
    .input-group .form-control{border-radius:0}
    .input-group .input-group-prepend + .form-control{border-radius:0}
    .input-group .form-control + .input-group-append .input-group-text{border-left:0}
    .custom-control-label{font-size:14px;color:#334155}
    input{border:1px solid #cbd5e1;border-radius:8px;padding:8px;width:100%;box-sizing:border-box}
    input.form-control{border-radius:0}
    .btn.btn-primary{background:#0f766e;color:#fff;border-color:#0f766e}
    .btn-outline-secondary{background:#fff;border:1px solid #cbd5e1;color:#334155}
    .d-none{display:none !important}
    .table{width:100%;border-collapse:collapse}
    .table td,.table th{border:1px solid #e2e8f0;padding:8px;text-align:left}
    .hiding{display:none}
    .result{display:inline-block;vertical-align:top}
    .dpLg{display:table-cell}.dpSm{display:none}
    .page-header{display:flex;align-items:center}
    .h4{font-size:1.4rem}.h5{font-size:1.1rem}
    .font-weight-bold{font-weight:700}
    .text-muted{color:#64748b}
    .small{font-size:12px}
    .border{border:1px solid #e2e8f0}
    .py-3{padding-top:12px;padding-bottom:12px}
    .px-4{padding-left:16px;padding-right:16px}
    .mb-4{margin-bottom:16px}
    .mt-4{margin-top:16px}
    .mx-1{margin-left:4px;margin-right:4px}
    .ask{margin-top:8px}
    @media (max-width: 700px){ .dpLg{display:none}.dpSm{display:block} }
    .intro-nav{display:flex;gap:14px;list-style:none;margin:0 0 10px;padding:0;border-bottom:1px solid #e2e8f0}
    .intro-nav a{display:inline-block;padding:8px 2px 10px;color:#334155;text-decoration:none;font-weight:700;font-size:14px;border-bottom:2px solid transparent}
    .intro-nav a.active{color:#0f766e;border-bottom-color:#0f766e}
    .tab-pane{display:none}
    .tab-pane.active.show{display:block}
    .long2{margin:4px 0}
    fieldset.my-1{border:1px solid #e2e8f0;padding:8px}
    .notice-muted{color:#64748b;font-size:13px}
  </style>
</head>
<body>
  <header class="global-header">
    <div class="global-header-inner">
      <a class="global-header-logo" aria-label="살집 홈" href="/">
        <span class="global-header-logo-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 10.2L12 4L19.5 10.2V19.5H4.5V10.2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
            <path d="M9 19.5V13.2H15V19.5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
            <path d="M7 9.5L10 7.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
            <path d="M13 11.5L15.2 9.8L17.5 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
            <circle cx="17.5" cy="8" r="1.1" fill="currentColor"></circle>
          </svg>
        </span>
        <span class="global-header-logo-text">살집</span>
      </a>
      <div></div>
      <nav class="global-header-menu" aria-label="주요 메뉴">
        <a class="global-header-menu-link" href="/mock/commission">중개보수(모방)</a>
        <a class="global-header-menu-link" href="/about">서비스 소개</a>
      </nav>
    </div>
  </header>
  <div class="container" id="main">
    <h3>중개보수(중개수수료) 계산</h3>
    <div class="intro p-3 mb-3 bg-light rounded shadow-s nocap card">
      <ul class="nav intro-nav">
        <li>
          <a class="active show" data-toggle="tab" href="#intro1">설명</a>
        </li>
        <li>
          <a data-toggle="tab" href="#intro2" class="">지역별 요율</a>
        </li>
        <li>
          <a data-toggle="tab" href="#intro3">요율의 상한</a>
        </li>
      </ul>
      <div class="tab-content">
        <div class="tab-pane fade active show" id="intro1">
          부동산 매매, 임대차 계약 시 공인중개사에 지불해야 하는 중개보수(중개수수료)를 계산합니다.
        </div>
        <div class="tab-pane fade" id="intro2">
          <p>중개보수 요율은 지역 조례에 따라 지역별로 차이가 날 수 있습니다. 본 계산 결과는 서울특별시를 기준으로 계산하였습니다. 나머지 지역들은 아래 지역별 부동산 중개보수 요율을 참고해주세요.</p>
          <b>▼ 지역별 부동산 중개보수 요율 ▼</b>
          <fieldset class="my-1" style="height:150px; overflow-y: auto">
            <dl>
              <dd class="long2"><a href="https://land.seoul.go.kr:444/land/broker/brokerageCommission.do" target="_blank">서울특별시 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="https://gris.gg.go.kr/reb/selectRebRateView.do" target="_blank">경기도 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="https://www.busan.go.kr/depart/ahestateprice01" target="_blank">부산광역시 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="http://www.daegu.go.kr/build//index.do?menu_id=00001346" target="_blank">대구광역시 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="https://www.incheon.go.kr/build/BU060102/274" target="_blank">인천광역시 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="https://www.gwangju.go.kr/build/contentsView.do?pageId=build25" target="_blank">광주광역시 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="https://www.seogu.go.kr/kor/content.do?mnucd=SGMENU0100188" target="_blank">대전광역시 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="http://www.ulsannamgu.go.kr/fieldInfo/realestateInfo03.jsp" target="_blank">울산광역시 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="https://www.provin.gangwon.kr/gw/portal/sub07_04_02" target="_blank">강원도 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="https://www.cheongju.go.kr/www/contents.do?key=513" target="_blank">충청북도 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="http://www.chungnam.go.kr:8100/cnnet/board.do?mnu_url=/cnbbs/view.do?board_seq=383303&amp;mnu_cd=CNNMENU00145&amp;searchCnd=0&amp;pageNo=2&amp;pageGNo=0&amp;showSplitNo=10&amp;code=34" target="_blank">충청남도 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="http://www.jeonju.go.kr/index.9is?contentUid=9be517a74f8dee91014f92b86ffa144b" target="_blank">전라북도 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="http://www.jeonnam.go.kr/contentsView.do?menuId=jeonnam0505060000" target="_blank">전라남도 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="http://www.gb.go.kr/Main/open_contents/section/economy/page.do?mnu_uid=2538&amp;LARGE_CODE=390&amp;MEDIUM_CODE=10&amp;SMALL_CODE=30&amp;SMALL_CODE2=10mnu_order=4" target="_blank">경상북도 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="https://www.gyeongnam.go.kr/board/view.gyeong?boardId=BBS_0000057&amp;menuCd=DOM_000000106006010001&amp;paging=ok&amp;startPage=1&amp;searchType=DATA_TITLE&amp;searchOperation=AND&amp;keyword=%EC%9A%94%EC%9C%A8&amp;categoryCode1=C14&amp;dataSid=95446" target="_blank">경상남도 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="http://www.jeju.go.kr/city/land/tariff.htm" target="_blank">제주특별자치도 부동산중개보수 요율</a></dd>
              <dd class="long2"><a href="https://www.sejong.go.kr/tmpl/pdf.jsp?pdfFilePath=/thumbnail/R0071/BBS_201811211052218120.pdf" target="_blank">세종특별자치시 부동산중개보수 요율</a></dd>
            </dl>
          </fieldset>
        </div>
        <div class="tab-pane fade" id="intro3">
          부동산 중개보수 요율표에 따른 중개보수는 중개보수의 상한선을 의미합니다. 상한선 범위 내에서 공인중개사와 고객이 협의할 수 있습니다.
        </div>
      </div>
    </div>

    <div class="btn-group dealType">
      <button type="button" class="btn sale active" onclick="setSale(this)">매매계약</button>
      <button type="button" class="btn lease" onclick="setLease(this)">전세계약</button>
      <button type="button" class="btn rent" onclick="setRent(this)">월세계약</button>
    </div>

    <div class="btn-group realEstateType">
      <button type="button" class="btn house active" onclick="setHouse(this)">주택</button>
      <button type="button" class="btn officetel" onclick="setOfficetel(this)">오피스텔</button>
      <button type="button" class="btn onlySale distribution" onclick="setDistrib(this)">분양권</button>
      <button type="button" class="btn etc" onclick="setEtc(this)">그 외</button>
    </div>

    <form id="form_commission" class="form-horizontal form-group card">
      <div class="row mb-1">
        <div class="col-12">
          <div class="custom-control custom-checkbox d-inline mr-3">
            <input type="checkbox" class="custom-control-input" id="customRateCheck">
            <label class="custom-control-label" for="customRateCheck">요율 직접 입력</label>
          </div>
          <div class="custom-control custom-checkbox d-inline-block">
            <input type="checkbox" class="custom-control-input" id="customVatRateYn">
            <label class="custom-control-label" for="customVatRateYn">부가세율 직접 입력</label>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-12 mb-2">
          <input type="hidden" id="dealType" name="dealType" value="sale">
          <input type="hidden" id="realEstateType" name="realEstateType" value="house">
        </div>
        <div class="col-md-6 mb-3">
          <div class="input-group">
            <div class="input-group-prepend">
              <span class="input-group-text" id="amount_type">매매가</span>
            </div>
            <input type="number" class="form-control number-helper" id="amount" name="amount" placeholder="금액 입력" value="">
            <div class="input-group-append">
              <span class="input-group-text">만원</span>
            </div>
          </div>
        </div>
        <div class="col-md-6 rentGroup mb-3 d-none" style="display: none;">
          <div class="input-group">
            <div class="input-group-prepend" id="amount_type">
              <span class="input-group-text">월세</span>
            </div>
            <input type="number" class="form-control number-helper" id="rent" name="rent" placeholder="금액 입력" value="">
            <div class="input-group-append">
              <span class="input-group-text">만원</span>
            </div>
          </div>
        </div>
        <div class="col-md-6 distGroup mb-3 d-none" style="display: none;">
          <div class="input-group">
            <div class="input-group-prepend" id="amount_type">
              <span class="input-group-text">프리미엄</span>
            </div>
            <input type="number" class="form-control number-helper" id="premium" name="premium" placeholder="금액 입력" value="">
            <div class="input-group-append">
              <span class="input-group-text">만원</span>
            </div>
          </div>
        </div>
        <div class="col-md-6 customGroup mb-3 d-none">
          <div class="input-group">
            <div class="input-group-prepend" id="amount_type">
              <span class="input-group-text">지정 요율</span>
            </div>
            <input type="number" class="form-control" id="customRate" name="customRate" placeholder="% 단위 입력" value="">
            <div class="input-group-append">
              <span class="input-group-text">%</span>
            </div>
          </div>
        </div>
        <div class="col-md-6 customVatGroup mb-3 d-none">
          <div class="input-group">
            <div class="input-group-prepend" id="amount_type">
              <span class="input-group-text">부가세율</span>
            </div>
            <input type="number" class="form-control" id="customVatRate" name="customVatRate" placeholder="% 단위 입력" value="10">
            <div class="input-group-append">
              <span class="input-group-text">%</span>
            </div>
          </div>
        </div>
        <div class="col-md-8 nocap">
          <button id="submit" type="button" onclick="return doTran('commission');" class="btn btn-primary">
            <i class="bi bi-calculator-fill"></i> 중개보수 계산
          </button>
        </div>
      </div>
    </form>

    <div class="hiding" style="display:none;">
      <div class="mt-4">
        <div class="d-inline mr-3 h4 font-weight-bold">계산 결과</div>
        <div class="custom-control custom-checkbox mb-3 d-inline ml-2 nocap">
          <input type="checkbox" id="number" class="custom-control-input" onchange="hideCol('.result',1)" checked="">
          <label class="custom-control-label" for="number">순번</label>
        </div>
      </div>
      <hr>
      <div id="resultSet" style="overflow-x: auto; white-space: nowrap;"></div>

      <div class="border py-3 px-4 mb-3 hiding nocap" style="display:none;">
        <h5 class="font-weight-bold mb-4">저장하기</h5>
        <div class="text-center saveButtons">
          <button type="button" id="btn_media_link" class="btn btn-outline-secondary align-bottom mx-1" onclick="showModalCalc('link')">
            <i class="bi bi-share"></i><br> URL 링크
          </button>
          <button type="button" id="btn_media_image" class="capture-media btn btn-outline-secondary align-bottom mx-1" onclick="showModalCalc('image')">
            <div class="spinner-grow"></div>
            <div>
              <i class="bi bi-file-image"></i><br> 사진 저장
            </div>
          </button>
          <button type="button" id="btn_media_pdf" class="capture-media btn btn-outline-secondary align-bottom mx-1" onclick="showModalCalc('pdf')">
            <div class="spinner-grow"></div>
            <i class="bi bi-file-pdf"></i><br> PDF 저장
          </button>
          <div id="directDown" class="mt-2" style="display:none">자동으로 다운로드가 되지 않으면 <span id="imageAnchor"></span>를 클릭해주세요.</div>
        </div>
      </div>
      <input type="hidden" id="savedId" value="">
      <div class="alert alert-warning alert-dismissible p-2 fade d-none copy url" role="alert" data-toggle="tooltip" title="" data-original-title="복사되었습니다!" data-clipboard-text="" style="display: none;">
        <span id="savedUri" class="d-inline-block small" style="color:black"></span>
        <strong class="d-inline-block small">저장 완료! 클릭하면 <span class="badge badge-info font-weight-normal"><i class="far fa-clipboard"></i> 주소 복사</span> </strong>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div class="hiding" style="display:none;">
        <div class="alert alert-success ask nocap blink" role="alert">문의사항이나 오류신고는 <a href="mailto:contact@fran.kr">이메일</a> 또는 <a href="#">게시판</a>을 통해 연락주시면 빠르게 답변 드리겠습니다.</div>
        <div id="basisWrap" class="p-3 my-3 alert-info rounded" style="display:none;">
          <h5>계산결과 해설</h5>
          <span id="basis"><p>(불입금액 + 프리미엄) × 상한 요율</p></span>
        </div>
      </div>
    </div>

    <div class="p-3 my-3 alert-info rounded nocap card">
      <h5>참고사항</h5>
      <div class="my-1"><i class="bi bi-exclamation-octagon-fill-fill"></i><b> 중개보수 요율표(서울 기준)</b></div>
      <table class="table table-sm table-bordered bg-white small">
        <thead>
          <tr>
            <th>종류</th>
            <th>거래내용</th>
            <th>거래금액</th>
            <th>상한요율</th>
            <th>한도액</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowspan="12">주택</td>
            <td rowspan="6">매매교환</td>
            <td>5천만원 미만</td>
            <td>1천분의 6</td>
            <td>25만원</td>
          </tr>
          <tr>
            <td>5천만원 이상~2억원 미만</td>
            <td>1천분의 5</td>
            <td>80만원</td>
          </tr>
          <tr>
            <td>2억원 이상~9억원 미만</td>
            <td>1천분의 4</td>
            <td>없음</td>
          </tr>
          <tr>
            <td>9억원 이상~12억원 미만</td>
            <td>1천분의 5</td>
            <td>없음</td>
          </tr>
          <tr>
            <td>12억원 이상~15억원 미만</td>
            <td>1천분의 6</td>
            <td>없음</td>
          </tr>
          <tr>
            <td>15억원 이상</td>
            <td colspan="2">1천분의 7</td>
          </tr>
          <tr>
            <td rowspan="6">임대차 등<br>(매매·교환 이외의 거래)</td>
            <td>5천만원 미만</td>
            <td>1천분의 5</td>
            <td>20만원</td>
          </tr>
          <tr>
            <td>5천만원 이상~1억원 미만</td>
            <td>1천분의 4</td>
            <td>30만원</td>
          </tr>
          <tr>
            <td>1억원 이상~6억원 미만</td>
            <td>1천분의 3</td>
            <td>없음</td>
          </tr>
          <tr>
            <td>6억원 이상~12억원 미만</td>
            <td>1천분의 4</td>
            <td>없음</td>
          </tr>
          <tr>
            <td>12억원 이상~15억원 미만</td>
            <td>1천분의 5</td>
            <td>없음</td>
          </tr>
          <tr>
            <td>15억원 이상</td>
            <td colspan="2">1천분의 6</td>
          </tr>
          <tr>
            <td rowspan="2">오피스텔</td>
            <td>매매교환</td>
            <td>-</td>
            <td colspan="2">1천분의 5</td>
          </tr>
          <tr>
            <td>임대차 등</td>
            <td>-</td>
            <td colspan="2">1천분의 4</td>
          </tr>
          <tr>
            <td>주택 이외</td>
            <td>거래금액의1천분의 ( ) 이내</td>
            <td>-</td>
            <td colspan="2">상한요율 1천분의 9 이내에서 중개<br>업자가 정한 상한요율 이하에서 협의</td>
          </tr>
        </tbody>
      </table>
      ※ 분양권의 거래금액 계산 : [거래당시까지 불입한 금액(융자포함)+프리미엄] × 상한요율
    </div>
  </div>
  ${runtimeScript}
</body>
</html>`;
}

function stripPattern(html: string, pattern: RegExp) {
  return html.replace(pattern, "");
}

function replacePattern(html: string, pattern: RegExp, replacement: string) {
  return html.replace(pattern, replacement);
}

function addOrReplaceAttr(tag: string, name: string, value: string) {
  const attrRegex = new RegExp(`${name}="[^"]*"`, "i");
  if (attrRegex.test(tag)) {
    return tag.replace(attrRegex, `${name}="${value}"`);
  }
  return tag.replace(/>$/, ` ${name}="${value}">`);
}

function normalizeExternalHref(href: string) {
  if (href.startsWith("//")) return `https:${href}`;
  return href;
}

function isAllowedExternalHref(href: string) {
  try {
    const parsed = new URL(normalizeExternalHref(href));
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_EXTERNAL_HOST_PATTERNS.some((pattern) => pattern.test(host));
  } catch {
    return false;
  }
}

function sanitizeFirstPass(html: string) {
  let out = html;

  // 광고 영역/광고 스크립트
  out = stripPattern(out, /<div class="adWrap[\s\S]*?<\/div>\s*<!-- 계산기 하단용 footer -->/g);
  out = stripPattern(out, /<ins class="adsbygoogle[\s\S]*?<\/ins>/g);
  out = stripPattern(out, /<script[^>]*src="[^"]*googlesyndication\.com\/pagead\/js\/adsbygoogle\.js"[^>]*><\/script>/g);
  out = stripPattern(out, /<script>\s*\(adsbygoogle = window\.adsbygoogle \|\| \[\]\)\.push\([\s\S]*?<\/script>/g);

  // 추적/분석 스크립트(원본 사이트 전용)
  out = stripPattern(out, /<script[^>]*src="[^"]*wcs\.naver\.net\/wcslog\.js"[^>]*><\/script>/g);
  out = stripPattern(out, /<script type="text\/javascript">[\s\S]*?wcs_do\(\);[\s\S]*?<\/script>/g);
  out = stripPattern(out, /<script async[^>]*src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=UA-[^"]*"[^>]*><\/script>/g);
  out = stripPattern(out, /<script>[\s\S]*?gtag\('config', 'UA-[\s\S]*?<\/script>/g);
  out = stripPattern(out, /<script defer[^>]*src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js[^"]*"[^>]*><\/script>/g);
  out = stripPattern(out, /<script>\s*if \(typeof menuEng !== 'undefined' && menuEng\) \{\s*updStat\(menuEng, 'view'\);\s*\}\s*<\/script>/g);

  // 외부 위젯(네이버 메인추가 / 클라우드플레어 Turnstile)
  out = stripPattern(out, /<script type="text\/javascript" src="https:\/\/openmain\.pstatic\.net\/js\/openmain\.js"><\/script>/g);
  out = stripPattern(out, /<div class="addNaverMainBtn[\s\S]*?<\/div>\s*<\/h5>/g);
  out = stripPattern(out, /<script src="https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js" defer=""><\/script>/g);
  out = stripPattern(out, /<div class="cf-turnstile[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g);
  out = stripPattern(out, /<iframe src="https:\/\/www\.google\.com\/recaptcha\/api2\/aframe"[\s\S]*?<\/iframe>/g);

  return out;
}

function sanitizeSecondPass(html: string) {
  let out = html;

  // 원본 브랜드/프로모션 제거
  out = stripPattern(out, /<div class="sidePromotion[\s\S]*?<\/div>/g);
  out = stripPattern(out, /<li class="nav-item d-lg-none android">[\s\S]*?<\/li>/g);
  out = stripPattern(out, /<li class="nav-item d-lg-none ios">[\s\S]*?<\/li>/g);

  // 대형 GNB를 축소 네비로 대체
  out = replacePattern(
    out,
    /<nav id="gnb"[\s\S]*?<\/nav>/,
    `<nav id="gnb" class="saljip-lite-nav">
      <a class="saljip-lite-brand" href="/">
        <strong>살집</strong><span>중개보수 계산기 (모방단계)</span>
      </a>
      <div class="saljip-lite-links">
        <a href="/">홈</a>
        <a href="/search">검색</a>
        <a href="/about">소개</a>
      </div>
    </nav>`
  );

  // 원본 푸터/브랜드 카피 제거
  out = stripPattern(out, /<div class="small text-center nocap mt-4"[\s\S]*?<\/footer>/g);

  // 원본 도메인 링크 제거/무력화
  out = replacePattern(out, /href="\/\/xn--989a00af8jnslv3dba\.com[^"]*"/g, 'href="#"');
  out = replacePattern(out, /href="https?:\/\/xn--989a00af8jnslv3dba\.com[^"]*"/g, 'href="#"');

  // 문구 치환
  out = replacePattern(out, /부동산계산기\.com/g, "살집");

  return out;
}

function sanitizeThirdPass(html: string) {
  let out = html;

  // 링크 정책 적용
  out = out.replace(/<a\b[^>]*href="[^"]*"[^>]*>/g, (tag) => {
    const hrefMatch = tag.match(/href="([^"]*)"/i);
    const href = hrefMatch?.[1] ?? "";

    if (!href) return tag;

    if (href.startsWith("#") || href.startsWith("/") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return tag;
    }

    if (href.startsWith("javascript:")) {
      return tag.replace(/href="[^"]*"/i, 'href="#"');
    }

    const isExternal = href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//");
    if (!isExternal) return tag;

    if (isAllowedExternalHref(href)) {
      let next = addOrReplaceAttr(tag, "target", "_blank");
      next = addOrReplaceAttr(next, "rel", "noopener noreferrer");
      return next;
    }

    return tag.replace(/href="[^"]*"/i, 'href="#"');
  });

  // 인라인 스타일 정리(공백/중복 세미콜론 정리)
  out = out.replace(/style="([^"]*)"/g, (_all, css: string) => {
    const normalized = css
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .join(";");

    if (!normalized) return "";
    return `style="${normalized}"`;
  });

  // 모방 화면 공통 스타일 주입
  if (out.includes("<head>")) {
    out = out.replace(
      "<head>",
      `<head>
      <style id="saljip-mock-overrides">
        .saljip-lite-nav{position:fixed;top:0;left:0;right:0;z-index:1040;background:#0f172a;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px}
        .saljip-lite-brand{font-size:1rem;color:#fff;text-decoration:none;display:flex;align-items:center;gap:8px}
        .saljip-lite-brand span{opacity:.75;font-size:.85rem}
        .saljip-lite-links{display:flex;gap:10px;align-items:center}
        .saljip-lite-links a{color:#fff;font-size:.9rem;text-decoration:none;opacity:.9}
      </style>`
    );
  }

  return out;
}

function sanitizeFourthPass(html: string) {
  let out = html;

  // jQuery 표현식 제거(onclick 인자)
  out = replacePattern(out, /\$\(this\)/g, "this");

  // 레거시 스크립트 전체 제거 (jQuery/bootstrap/common/calc 및 inline 의존 코드 포함)
  out = stripPattern(out, /<script[\s\S]*?<\/script>/g);

  // 최소 동작용 스크립트 주입
  const runtimeScript = getRuntimeScript();

  if (out.includes("</body>")) {
    out = out.replace("</body>", `${runtimeScript}</body>`);
  }

  return out;
}

export async function GET() {
  try {
    const response = await fetch(SOURCE_URL, {
      cache: "no-store",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      const fallback = buildFallbackHtml();
      return new NextResponse(fallback, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-saljip-mock-fallback": `upstream-${response.status}`
        }
      });
    }

    let html = await response.text();
    html = sanitizeFirstPass(html);
    html = sanitizeSecondPass(html);
    html = sanitizeThirdPass(html);
    html = sanitizeFourthPass(html);

    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head><meta name="robots" content="noindex,nofollow"><base href="${SOURCE_ORIGIN}/">`);
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  } catch {
    const fallback = buildFallbackHtml();
    return new NextResponse(fallback, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-saljip-mock-fallback": "fetch-error"
      }
    });
  }
}
