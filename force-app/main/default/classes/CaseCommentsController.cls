public class CaseCommentsController {
    public CaseCommentsController() {

    }

    @AuraEnabled
    public static String getCaseComments(String caseId) {
        String response = '';
        List<CasCommentInfoWrapper> casCommList = new List<CasCommentInfoWrapper>();
        Map<String,CaseComment_Extension__c> mapCustCasComment = new Map<String,CaseComment_Extension__c>();
        Map<String,CaseComment> mapCasComment = new Map<String,CaseComment>([SELECT Id, ParentId, IsPublished, CommentBody, CreatedDate, CreatedBy.Name, LastModifiedDate, LastModifiedById FROM CaseComment 
        where parentId=:caseId order by CreatedDate desc]);

        for(CaseComment_Extension__c casComm : [SELECT Id, CaseCommentId__c,Classification__c FROM CaseComment_Extension__c 
        where CaseCommentId__c=:mapCasComment.keySet() order by CreatedDate desc]){
            mapCustCasComment.put(casComm.CaseCommentId__c,casComm);
        }

        for(String custComm : mapCustCasComment.keySet()){
            CasCommentInfoWrapper casCommWrap = new CasCommentInfoWrapper();
            casCommWrap.CasCommentId = mapCasComment.get(custComm).Id;
            casCommWrap.CommentBody = mapCasComment.get(custComm).CommentBody;
            casCommWrap.CreatedDate = mapCasComment.get(custComm).CreatedDate.format('MM/dd/yyyy hh:mm a');
            casCommWrap.createByName = mapCasComment.get(custComm).CreatedBy.Name;
            casCommWrap.IsPublic = mapCasComment.get(custComm).IsPublished;
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
                createComm.IsPublished = Boolean.valueOf(caseCommInfo.get('IsPublic'));
                insert createComm;

                CaseComment_Extension__c createCustComm = new CaseComment_Extension__c();
                createCustComm.Classification__c = caseCommInfo.get('Classification');
                createCustComm.CaseCommentId__c = createComm.Id;
                insert createCustComm;
            }
            
        } catch (Exception ex) {
            System.debug(ex.getMessage());
            throw new AuraHandledException('Exception in createCaseComments method: '+ex.getMessage());            
        }
    }

    @AuraEnabled
    public static void updateCaseComments(Map<String,String> caseCommInfo) {
        try {
            if(caseCommInfo!=null && caseCommInfo.keySet().size()>0){
                CaseComment createComm = new CaseComment();
                createComm.CommentBody = caseCommInfo.get('CommentBody');
                createComm.Id = caseCommInfo.get('CasCommentId');
                createComm.IsPublished = Boolean.valueOf(caseCommInfo.get('IsPublic'));
                update createComm;

                CaseComment_Extension__c getCustCommId =[Select Id from CaseComment_Extension__c where CaseCommentId__c=: createComm.Id];
                if(getCustCommId!=null){
                    CaseComment_Extension__c createCustComm = new CaseComment_Extension__c();
                    createCustComm.Classification__c = caseCommInfo.get('Classification');
                    createCustComm.Id = getCustCommId.Id;
                    update createCustComm;
                }                
            }            
        } catch (Exception ex) {
            System.debug(ex.getMessage());
            throw new AuraHandledException('Exception in updateCaseComments method: '+ex.getMessage());            
        }
    }

    @AuraEnabled
    public static void deleteCaseComment(String caseCommId) {
        try {
            if(caseCommId!=null){
                CaseComment delComm = new CaseComment();
                delComm.Id = caseCommId;
                delete delComm;

                CaseComment_Extension__c delCustComm =[Select id from CaseComment_Extension__c where CaseCommentId__c=: caseCommId];                
                delete delCustComm;
            }
            
        } catch (Exception ex) {
            System.debug(ex.getMessage());
            throw new AuraHandledException('Exception in deleteCaseComment method: '+ex.getMessage());
        }

    }

    @AuraEnabled
    public static List<String> fetchEmailAddrFromCase(String caseId) {
        List<String> setEmailAddr = null;
        Map<String,String> mapEmailAddr = null;
        try {
            if(caseId!=null){                
                mapEmailAddr = new Map<String,String>(); 
                for(EmailMessage emList : [select id,FromAddress, ToAddress, CcAddress from EmailMessage where ParentId =: caseId]){
                    if(emList.FromAddress!=null)
                        mapEmailAddr.put(emList.FromAddress, emList.FromAddress);
                    if(emList.ToAddress!=null)
                        mapEmailAddr.put(emList.ToAddress,emList.ToAddress);
                    if(emList.CcAddress!=null)
                        mapEmailAddr.put(emList.CcAddress,emList.CcAddress);
                }
                if (mapEmailAddr!=null && mapEmailAddr.size()>0) {
                    setEmailAddr = new List<String>();
                    setEmailAddr.addAll(mapEmailAddr.keySet());
                }
            }
        } catch (Exception ex) {
            System.debug(ex.getMessage());
            throw new AuraHandledException('Exception in fetchEmailAddrFromCase method: '+ex.getMessage());
        }
        return setEmailAddr;
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
        @AuraEnabled
        public Boolean IsPublic {get;set;}
    }
}
