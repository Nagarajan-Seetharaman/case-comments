public class CaseCommentsController {
    public CaseCommentsController() {

    }

    @AuraEnabled
    public static String getCaseComments(String caseId) {
        String response = '';
        List<CasCommentInfoWrapper> casCommList = new List<CasCommentInfoWrapper>();
        Map<String,Case_Comment__c> mapCustCasComment = new Map<String,Case_Comment__c>();
        Map<String,CaseComment> mapCasComment = new Map<String,CaseComment>([SELECT Id, ParentId, IsPublished, CommentBody, CreatedDate, CreatedBy.Name, LastModifiedDate, LastModifiedById FROM CaseComment 
        where parentId=:caseId order by CreatedDate desc]);

        for(Case_Comment__c casComm : [SELECT Id, CaseCommentId__c,Classification__c FROM Case_Comment__c 
        where CaseCommentId__c=:mapCasComment.keySet() order by CreatedDate desc]){
            mapCustCasComment.put(casComm.CaseCommentId__c,casComm);
        }

        for(String custComm : mapCustCasComment.keySet()){
            CasCommentInfoWrapper casCommWrap = new CasCommentInfoWrapper();
            casCommWrap.CasCommentId = mapCasComment.get(custComm).Id;
            casCommWrap.CommentBody = mapCasComment.get(custComm).CommentBody;
            casCommWrap.CreatedDate = mapCasComment.get(custComm).CreatedDate.format('MM/dd/yyyy hh:mm a');
            casCommWrap.createByName = mapCasComment.get(custComm).CreatedBy.Name;
            casCommWrap.Classification = mapCustCasComment.get(custComm).Classification__c;
            casCommList.add(casCommWrap);
        }

        system.debug('casCommList: '+casCommList);
        response = JSON.serialize(casCommList, true);

        return response;        
    }

    @AuraEnabled
    public static void createCaseComments(Map<String,String> caseCommInfo) {
        try {
            if(caseCommInfo!=null && caseCommInfo.keySet().size()>0){
                CaseComment createComm = new CaseComment();
                createComm.CommentBody = caseCommInfo.get('CommentBody');
                createComm.parentId = caseCommInfo.get('CaseId');
                insert createComm;

                Case_Comment__c createCustComm = new Case_Comment__c();
                createCustComm.Classification__c = caseCommInfo.get('Classification');
                createCustComm.CaseCommentId__c = createComm.Id;
                createCustComm.Name = createComm.Id;
                insert createCustComm;
            }
            
        } catch (Exception ex) {
            System.debug(ex.getMessage());
            throw new AuraHandledException('Exception in createCaseComments method: '+ex.getMessage());            
        }
    }

    public class CasCommentInfoWrapper {
        @AuraEnabled
        public String CasCommentId {get;set;}
        @AuraEnabled
        public String CommentBody {get;set;}
        @AuraEnabled
        public String CreatedDate {get;set;}
        @AuraEnabled
        public String createByName {get;set;}
        @AuraEnabled
        public String Classification {get;set;}
    }
}
