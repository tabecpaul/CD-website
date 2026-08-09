import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import LegalDocument from "@/components/LegalDocument";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "결제 및 환불정책 | Career Direct Korea",
};

export default function RefundPolicyPage() {
  return (
    <>
      <main className="flex flex-1 flex-col bg-cream">
        <PageHeader />
        <LegalDocument title="결제 및 환불정책" effectiveDate="2026년 8월 9일">
          <h2>제1조 (목적)</h2>
          <p>
            이 정책은 Career Direct Korea(이하 &ldquo;회사&rdquo;)가 제공하는
            Career Direct 평가 및 컨설팅 통합 서비스의 결제, 일정 변경,
            취소와 환불 절차를 정합니다.
          </p>

          <h2>제2조 (상품과 이용요금)</h2>
          <table>
            <thead>
              <tr>
                <th>상품</th>
                <th>대상</th>
                <th>공급가</th>
                <th>부가세</th>
                <th>결제금액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>청년 통합 패키지</td>
                <td>만 15~28세, 재학 여부 무관</td>
                <td>350,000원</td>
                <td>35,000원</td>
                <td>385,000원</td>
              </tr>
              <tr>
                <td>성인 통합 패키지</td>
                <td>만 29세 이상</td>
                <td>450,000원</td>
                <td>45,000원</td>
                <td>495,000원</td>
              </tr>
            </tbody>
          </table>
          <p>
            두 상품에는 온라인 평가, 상세 보고서, 연속 3시간 결과 해석
            컨설팅, 인터랙티브 실행계획과 후속 자료가 포함됩니다. 회사는
            평가만 별도로 판매하지 않습니다.
          </p>

          <h2>제3조 (결제방법과 계약 성립)</h2>
          <ol>
            <li>결제수단은 회사가 안내하는 계좌로의 무통장입금입니다.</li>
            <li>
              회사는 20분 무료 콜백 후 고객에게 적합한 상품, 금액, 입금계좌와
              입금기한을 이메일로 안내합니다.
            </li>
            <li>입금기한은 안내 이메일 발송 시점부터 72시간입니다.</li>
            <li>
              회사가 입금을 확인하고 고객에게 입금 확인 이메일을 보낸 때
              유료 서비스 이용계약이 성립합니다.
            </li>
          </ol>

          <h2>제4조 (현금영수증 및 세금계산서)</h2>
          <ol>
            <li>
              개인 고객은 요청 시 신청서에 등록한 휴대전화 번호로
              현금영수증을 발행받을 수 있습니다.
            </li>
            <li>
              사업자 고객은 입금 안내 이메일에 사업자등록증과 세금계산서
              수신 이메일을 회신하여 발행을 요청할 수 있습니다.
            </li>
          </ol>

          <h2>제5조 (평가 링크와 등록)</h2>
          <ol>
            <li>
              입금 확인 후 Career Direct 본부 시스템이 고객 이메일로 평가
              링크를 발송합니다.
            </li>
            <li>
              평가 링크 발송 후 14일 이내이며 고객이 본부 사이트에 아직
              등록하지 않은 경우, 회사는 링크 취소 가능 여부를 확인한 뒤
              전액 환불할 수 있습니다.
            </li>
            <li>
              고객이 본부 사이트에 등록한 이후에는 평가·보고서 제공분
              165,000원은 환불되지 않습니다.
            </li>
          </ol>

          <h2>제6조 (컨설팅 취소와 환불)</h2>
          <table>
            <thead>
              <tr>
                <th>취소 시점</th>
                <th>청년 통합 패키지</th>
                <th>성인 통합 패키지</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>컨설팅 시작 48시간 초과 전</td>
                <td>220,000원</td>
                <td>330,000원</td>
              </tr>
              <tr>
                <td>컨설팅 시작 48시간 이내 또는 노쇼</td>
                <td>198,000원</td>
                <td>297,000원</td>
              </tr>
              <tr>
                <td>컨설팅 시작 후 고객 사유 중단</td>
                <td colSpan={2}>원칙적으로 환불 불가</td>
              </tr>
            </tbody>
          </table>

          <h2>제7조 (일정 변경)</h2>
          <ol>
            <li>컨설팅 시작 48시간 초과 전 최초 1회 변경은 무료입니다.</li>
            <li>
              두 번째 변경 또는 시작 48시간 이내 변경 시 컨설팅 금액의
              10%(청년 22,000원, 성인 33,000원)를 차감할 수 있습니다.
            </li>
            <li>
              천재지변, 입원 등 불가항력 사유가 확인되면 회사는 차감액을
              면제할 수 있습니다.
            </li>
            <li>변경된 컨설팅은 최초 예정일로부터 60일 이내 완료합니다.</li>
          </ol>

          <h2>제8조 (회사의 사유로 서비스를 제공하지 못한 경우)</h2>
          <p>
            컨설팅이 시작된 후 회사의 사유로 일부 시간을 제공하지 못한
            경우에는 미제공 시간을 30분 단위로 계산하여 환불합니다. 30분당
            기준은 청년 36,667원, 성인 55,000원이며, 최종 환불액은 각 상품의
            컨설팅 배분액을 초과하지 않습니다.
          </p>

          <h2>제9조 (환불 절차)</h2>
          <ol>
            <li>
              고객은 이메일(
              <a href="mailto:dulospaul@gmail.com">dulospaul@gmail.com</a>) 또는
              전화(010-5231-1059)로 취소·환불을 요청합니다.
            </li>
            <li>회사는 진행 단계와 일정에 따라 환불 예정액을 안내합니다.</li>
            <li>
              환불 확정 후 고객이 회신으로 제공한 계좌에 3영업일 이내
              입금합니다. 환불계좌 정보는 서비스 시스템에 저장하지 않습니다.
            </li>
          </ol>

          <h2>제10조 (문의)</h2>
          <ul>
            <li>
              이메일: <a href="mailto:dulospaul@gmail.com">dulospaul@gmail.com</a>
            </li>
            <li>전화: 010-5231-1059</li>
          </ul>

          <h2>부칙</h2>
          <p>이 정책은 2026년 8월 9일부터 시행합니다.</p>
        </LegalDocument>
      </main>
      <Footer />
    </>
  );
}
