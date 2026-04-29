import DailyQuestionnairePanel from "@/components/questionnaires/DailyQuestionnairePanel";
import PageIntro from "@/components/PageIntro";
import { PRODUCT_NAME } from "@/lib/productCopy";

const DailyQuestionnairePage = () => {
 return (
  <div className="container mx-auto space-y-6 p-6">
   <PageIntro
    eyebrow="My state"
    title="Daily questionnaire восстановления"
    description="This is a separate workspace for the daily background. Here you quickly record sleep and screen time so the CRM reads state more accurately and notices form changes in time."
    collapsible
    bullets={[
     "Filled separately from tests",
     "Needed for the daily recovery signal",
     `After purchase ${PRODUCT_NAME} открывается полная история и расширенная аналитика`,
    ]}
   />

   <DailyQuestionnairePanel
    eyebrow="Daily questionnaire"
    title="Sleep, screen time, and daily baseline"
    description="Fill in the questionnaire as a separate daily ritual. This is the fastest way to update the recovery signal and keep форму под контролем."
   />
  </div>
 );
};

export default DailyQuestionnairePage;
