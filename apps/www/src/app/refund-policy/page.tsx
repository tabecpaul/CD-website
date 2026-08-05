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
        <LegalDocument
          title="결제 및 환불정책"
          effectiveDate="2026년 8월 5일"
        >
          <p className="legal-note">
            대괄호([ ])로 표시된 항목은 상품·가격 및 결제대행사(PG사) 확정
            후 업데이트가 필요합니다.
          </p>

          <h2>제1조 (목적)</h2>
          <p>
            이 정책은 Career Direct Korea(이하 &ldquo;회사&rdquo;)가 제공하는
            진로 평가 및 컨설팅 서비스의 결제, 청약철회, 환불 기준 및
            절차에 관한 사항을 정합니다.
          </p>

          <h2>제2조 (결제수단)</h2>
          <p>
            이용자는 신용카드로 서비스 이용료를 결제할 수 있습니다.
          </p>
          <p>
            ※ 결제대행사(PG사) 연동 완료 전까지 결제 화면은 결제 신청 접수
            용도로만 운영됩니다.
          </p>

          <h2>제3조 (청약철회)</h2>
          <ol>
            <li>
              이용자는 서비스 결제일로부터 7일 이내이며 진단이 개시되지
              않은 경우, 전자상거래 등에서의 소비자보호에 관한 법률에 따라
              청약을 철회하고 결제 금액 전액을 환불받을 수 있습니다.
            </li>
            <li>
              다만 다음 각 호에 해당하는 경우 청약철회가 제한될 수
              있습니다.
              <ul>
                <li>
                  이용자에게 책임 있는 사유로 서비스가 멸실 또는 훼손된
                  경우
                </li>
                <li>진단도구 라이선스가 이미 발급되어 사용이 개시된 경우</li>
                <li>
                  서비스의 성질상 청약철회 시 회사에 회복할 수 없는 손해가
                  발생하는 경우로서 사전에 동의를 받은 경우
                </li>
              </ul>
            </li>
          </ol>

          <h2>제4조 (환불 기준)</h2>
          <table>
            <thead>
              <tr>
                <th>진행 단계</th>
                <th>환불 비율</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>평가(진단) 검사 전</td>
                <td>결제금액의 100%</td>
              </tr>
              <tr>
                <td>평가(진단) 검사 완료 후 ~ 해석 상담 전</td>
                <td>결제금액의 50%</td>
              </tr>
              <tr>
                <td>해석 상담 완료 후</td>
                <td>환불 불가</td>
              </tr>
            </tbody>
          </table>
          <p>
            ※ 위 환불 비율은 정식 상품·가격 확정 전 임시 기준이며, 확정
            시 갱신됩니다.
          </p>

          <h2>제5조 (환불 절차 및 소요기간)</h2>
          <ol>
            <li>
              환불을 원하는 이용자는 이메일(
              <a href="mailto:dulospaul@gmail.com">dulospaul@gmail.com</a>)
              또는 전화(010-5231-1059)로 환불을 요청합니다.
            </li>
            <li>
              회사는 환불 요청 접수 후 [3]영업일 이내에 환불 가능 여부와
              금액을 안내합니다.
            </li>
            <li>
              환불이 확정된 경우, 결제수단과 동일한 방법으로
              [3~5]영업일 이내에 환불이 이루어집니다. 다만 결제대행사
              사정에 따라 소요기간은 달라질 수 있습니다.
            </li>
          </ol>

          <h2>제6조 (문의)</h2>
          <p>결제 및 환불과 관련한 문의는 아래로 연락해 주시기 바랍니다.</p>
          <ul>
            <li>
              이메일: <a href="mailto:dulospaul@gmail.com">dulospaul@gmail.com</a>
            </li>
            <li>전화: 010-5231-1059</li>
          </ul>

          <h2>부칙</h2>
          <p>이 정책은 2026년 8월 5일부터 시행합니다.</p>
        </LegalDocument>
      </main>
      <Footer />
    </>
  );
}
