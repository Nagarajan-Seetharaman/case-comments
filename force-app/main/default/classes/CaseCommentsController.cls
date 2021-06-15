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

        for(CaseComment_Extension__c casComm : [SELECT Id, CaseCommentId__c,Classification__c,ToAddress__c,CcAddress__c,BccAddress__c FROM CaseComment_Extension__c 
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
            casCommWrap.CasCommToAddr = mapCustCasComment.get(custComm).ToAddress__c!=null ? prepareEmailAddrList(mapCustCasComment.get(custComm).ToAddress__c) : null;
            casCommWrap.CasCommCcAddr = mapCustCasComment.get(custComm).CcAddress__c!=null ? prepareEmailAddrList(mapCustCasComment.get(custComm).CcAddress__c) : null;
            casCommWrap.CasCommBccAddr = mapCustCasComment.get(custComm).BccAddress__c!=null ? prepareEmailAddrList(mapCustCasComment.get(custComm).BccAddress__c) : null;
            casCommList.add(casCommWrap);
        }

        system.debug('casCommList: '+casCommList);
        response = JSON.serialize(casCommList, true);

        return response;        
    }

    @AuraEnabled
    public static void createCaseComments(Map<String,String> caseCommInfo,Map<String,List<String>> allEmailAddr) {
        try {
            System.debug('toaddress: '+allEmailAddr.get('ToAddress'));
            System.debug('ccaddress: '+allEmailAddr.get('CcAddress'));
            System.debug('bccaddress: '+allEmailAddr.get('BccAddress'));
            String[] ToAddress = allEmailAddr.get('ToAddress');
            String[] CcAddress = allEmailAddr.get('CcAddress');
            String[] BccAddress = allEmailAddr.get('BccAddress');
            if(caseCommInfo!=null && caseCommInfo.keySet().size()>0){
                String commentBody = caseCommInfo.get('CommentBody');
                String caseId = caseCommInfo.get('CaseId');
                Boolean isPublic = Boolean.valueOf(caseCommInfo.get('IsPublic'));
                CaseComment createComm = new CaseComment();
                createComm.CommentBody = commentBody;
                createComm.parentId = caseId;
                createComm.IsPublished = isPublic;
                insert createComm;

                CaseComment_Extension__c createCustComm = new CaseComment_Extension__c();
                createCustComm.Classification__c = caseCommInfo.get('Classification');
                if(isPublic){
                    createCustComm.ToAddress__c = prepareEmailAddrFormat(ToAddress);
                    createCustComm.CcAddress__c = CcAddress!=null ? prepareEmailAddrFormat(CcAddress) : '';
                    createCustComm.BccAddress__c = BccAddress!=null ? prepareEmailAddrFormat(BccAddress) : '';
                }                
                createCustComm.CaseCommentId__c = createComm.Id;
                insert createCustComm;

                if(isPublic){
                    sendMailForCaseComment(ToAddress, CcAddress, BccAddress,commentBody,caseId);
                }                
            }
            
        } catch (Exception ex) {
            System.debug(ex.getMessage());
            throw new AuraHandledException('Exception in createCaseComments method: '+ex.getMessage());            
        }
    }

    public static String prepareEmailAddrFormat(String[] emailAddr){
        String emFormatAddr='';
        for (String emAddr : emailAddr) {
            emFormatAddr += emAddr+';';
        }
        return emFormatAddr;
    }

    public static List<String> prepareEmailAddrList(String emailAddr){
        List<String> lstEmAddr = new List<String>();
        for (String emAddr : emailAddr.split(';')) {
            lstEmAddr.add(emAddr);
        }
        return lstEmAddr;
    }

    public static void sendMailForCaseComment(String[] toAddr,String[] ccAddr,String[] bccAddr,String casComm,String casId){
        List<Messaging.SingleEmailMessage> lstMessage = new List<Messaging.SingleEmailMessage>();
        Messaging.SingleEmailMessage message = new Messaging.SingleEmailMessage();        
        Case cas = [Select Id,CaseNumber from Case where Id=:casId];
        EmailTemplate template = [SELECT Id, Subject, HtmlValue,DeveloperName,Body FROM EmailTemplate WHERE DeveloperName ='Case_Comments_Creation'];
        String subject = ''; String htmlBody='';String plainBody = '';
        subject = template.Subject;
        htmlBody = template.HtmlValue;
        plainBody = template.Body;
        
        if(cas.CaseNumber != null){
            subject = subject.replace('{!Case.CaseNumber}', cas.CaseNumber);
            htmlBody = htmlBody.replace('{!Case.CaseNumber}', cas.CaseNumber);
            htmlBody = htmlBody.replace('{!casenumber}',cas.CaseNumber);
            plainBody = plainBody.replace('{!Case.CaseNumber}', cas.CaseNumber);
            plainBody = plainBody.replace('{!casenumber}',cas.CaseNumber);
        }
        else{
            subject = subject.replace('{!Case.CaseNumber}', '');
            htmlBody = htmlBody.replace('{!Case.CaseNumber}', '');
            htmlBody = htmlBody.replace('{!casenumber}','');
            plainBody = plainBody.replace('{!Case.CaseNumber}', '');
            plainBody = plainBody.replace('{!casenumber}','');
        }        
        if(casComm != null){
            htmlBody = htmlBody.replace('{!CaseComment}',casComm);
            plainBody = plainBody.replace('{!CaseComment}',casComm);
        }
        else{
            htmlBody = htmlBody.replace('{!CaseComment}','');
            plainBody = plainBody.replace('{!CaseComment}','');
        }        
        htmlBody = htmlBody.replaceAll('<!\\[CDATA\\[', '');
        htmlBody = htmlBody.replaceAll(']]>', '');
        message.setSubject(subject);
        message.setWhatId(cas.Id);
        message.setHtmlBody(htmlBody);
        message.setPlainTextBody(plainBody);
        message.setToAddresses(toAddr);
        if(ccAddr!=null)
            message.setCcAddresses(ccAddr);
        if(bccAddr!=null)
            message.setBccAddresses(bccAddr);
        message.setOrgWideEmailAddressId(label.Yourresponse_OrgId);
        lstMessage.add(message);
        if(lstMessage.size()>0){
            try {
                Messaging.sendEmail(lstMessage);
            }
            Catch(Exception e){
                System.debug('Exception-->'+e);
            }
        }

    }

    @AuraEnabled
    public static void updateCaseComments(Map<String,String> caseCommInfo,Map<String,List<String>> allEmailAddr) {
        try {
            System.debug('toaddress: '+allEmailAddr.get('ToAddress'));
            System.debug('ccaddress: '+allEmailAddr.get('CcAddress'));
            System.debug('bccaddress: '+allEmailAddr.get('BccAddress'));
            String[] ToAddress = allEmailAddr.get('ToAddress');
            String[] CcAddress = allEmailAddr.get('CcAddress');
            String[] BccAddress = allEmailAddr.get('BccAddress');
            if(caseCommInfo!=null && caseCommInfo.keySet().size()>0){
                String commentBody = caseCommInfo.get('CommentBody');
                Boolean isPublic = Boolean.valueOf(caseCommInfo.get('IsPublic'));
                CaseComment createComm = new CaseComment();
                createComm.CommentBody = commentBody;
                createComm.Id = caseCommInfo.get('CasCommentId');
                createComm.IsPublished = isPublic;
                update createComm;

                CaseComment_Extension__c getCustCommId =[Select Id from CaseComment_Extension__c where CaseCommentId__c=: createComm.Id];
                if(getCustCommId!=null){
                    CaseComment_Extension__c createCustComm = new CaseComment_Extension__c();
                    createCustComm.Classification__c = caseCommInfo.get('Classification');
                    if(isPublic){
                        createCustComm.ToAddress__c = prepareEmailAddrFormat(ToAddress);
                        createCustComm.CcAddress__c = CcAddress!=null ? prepareEmailAddrFormat(CcAddress) : '';
                        createCustComm.BccAddress__c = BccAddress!=null ? prepareEmailAddrFormat(BccAddress) : '';
                    }
                    createCustComm.Id = getCustCommId.Id;
                    update createCustComm;
                }
                if(isPublic){                    
                    CaseComment casCom = [Select id,ParentId from CaseComment where id=: createComm.Id];
                    if(casCom!=null)
                        sendMailForCaseComment(ToAddress, CcAddress, BccAddress,commentBody,casCom.ParentId);
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
        @AuraEnabled
        public List<String> CasCommToAddr {get;set;}
        @AuraEnabled
        public List<String> CasCommCcAddr {get;set;}
        @AuraEnabled
        public List<String> CasCommBccAddr {get;set;}
    }
}
