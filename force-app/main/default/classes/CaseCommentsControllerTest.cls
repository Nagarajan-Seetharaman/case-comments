@isTest
public class CaseCommentsControllerTest {
    
    @isTest
    public static void TestMethod1(){
        User usr =[select id,firstname,lastname,name,FederationIdentifier,profileid from user where  isactive=true and profile.name='system administrator'  limit 1];
        System.runas(usr)
        {
            account acctest= (account)SObjectFactory.create(
                account.sObjectType, new Map<Schema.SObjectField, Object>
                {
                    account.Name => 'Test Account New',
                        account.Customer_Status__c => 'Active',
                        account.Strategic_Business_Unit__c => 'ATR',
                        account.CBT__c => 'Airlines',
                        account.Region_Name__c => 'Americas',
                        account.Sub_Region_Name__c => 'Canada',
                        account.Service_Level__c => 'Unauthorized Dist/Brkr',               
                        account.Type => 'OEM',
                        account.REPORT_ACCOUNT_NAME__c => 'Test Account New',
                        account.Market_Name__c => 'Marine'        
                        });                        
            Contact con = new Contact();
            con.accountId=acctest.Id;
            con.LastName = 'Nanjappan';
            con.FirstName = 'Nandini';
            con.Primary_Email_Address__c = 'nandini.nanjappan@nttdata.com';
            con.Email='nandini.nanjappan@nttdata.com';
            insert con;   
            Set<Id> setCasId= new Set<Id>();
            Id RecordtypeId = Schema.SObjectType.Case.getRecordTypeInfosByDeveloperName().get('Repair_Overhaul').getRecordTypeId(); 
            Case cs= new Case();
            cs.Origin = 'SAP Interface';
            cs.RecordTypeId = RecordtypeId;
            cs.Classification__c = 'R&O Issue';
            cs.ContactId = con.Id;
            cs.Type_of_Change__c = 'New Account';
            cs.Type = 'Other';
            cs.Export_Compliance_Content_ITAR_EAR__c = 'NO';
            cs.Government_Compliance_SM_M_Content__c = 'NO';  
            cs.OwnerId=label.aero_default_user_id;            
            insert cs; 
            CaseComment createComm = new CaseComment();
            createComm.CommentBody = 'TestComment';
            createComm.parentId = cs.Id;
            createComm.IsPublished = false;
            insert createComm;
            //List<string> lstEmailAddr = new List<string>{'test@test.com','test1@test.com'};
            CaseComment_Extension__c createCustComm = new CaseComment_Extension__c();
            createCustComm.Classification__c = 'Manual';
            createCustComm.CaseCommentId__c = createComm.Id;
            insert createCustComm;
            Test.startTest();
            CaseCommentsController.getCaseComments(cs.Id);
            Test.stopTest();
        }
    }
    
    @isTest
    public static void TestMethod2(){
        User usr =[select id,firstname,lastname,name,FederationIdentifier,profileid from user where  isactive=true and profile.name='system administrator'  limit 1];
        System.runas(usr)
        {
            account acctest= (account)SObjectFactory.create(
                account.sObjectType, new Map<Schema.SObjectField, Object>
                {
                    account.Name => 'Test Account New',
                        account.Customer_Status__c => 'Active',
                        account.Strategic_Business_Unit__c => 'ATR',
                        account.CBT__c => 'Airlines',
                        account.Region_Name__c => 'Americas',
                        account.Sub_Region_Name__c => 'Canada',
                        account.Service_Level__c => 'Unauthorized Dist/Brkr',               
                        account.Type => 'OEM',
                        account.REPORT_ACCOUNT_NAME__c => 'Test Account New',
                        account.Market_Name__c => 'Marine'        
                        });                        
            Contact con = new Contact();
            con.accountId=acctest.Id;
            con.LastName = 'Nanjappan';
            con.FirstName = 'Nandini';
            con.Primary_Email_Address__c = 'nandini.nanjappan@nttdata.com';
            con.Email='nandini.nanjappan@nttdata.com';
            insert con;   
            Set<Id> setCasId= new Set<Id>();
            Id RecordtypeId = Schema.SObjectType.Case.getRecordTypeInfosByDeveloperName().get('Repair_Overhaul').getRecordTypeId(); 
            Case cs= new Case();
            cs.Origin = 'SAP Interface';
            cs.RecordTypeId = RecordtypeId;
            cs.Classification__c = 'R&O Issue';
            cs.ContactId = con.Id;
            cs.Type_of_Change__c = 'New Account';
            cs.Type = 'Other';
            cs.Export_Compliance_Content_ITAR_EAR__c = 'NO';
            cs.Government_Compliance_SM_M_Content__c = 'NO';  
            cs.OwnerId=label.aero_default_user_id;            
            insert cs; 
            
            map<String,String> caseCommInfo = new map<String,String>();
            Map<String,List<String>> allEmailAddr = new Map<String,List<String>>();
            caseCommInfo.put('CommentBody', 'TestComment');
            caseCommInfo.put('CaseId', cs.Id);
            caseCommInfo.put('IsPublic', 'true');
            caseCommInfo.put('Classification', 'Manual');
            
            list<string> emailAddr = new list<string>{'test@test.com','test1@test.com'};
            allEmailAddr.put('ToAddress',emailAddr);
            allEmailAddr.put('CcAddress',emailAddr);
            
            
            Test.startTest();
            CaseCommentsController.createCaseComments(caseCommInfo, allEmailAddr);
            Test.stopTest();
        }
    }
    
    @isTest
    public static void TestMethod3(){
        User usr =[select id,firstname,lastname,name,FederationIdentifier,profileid from user where  isactive=true and profile.name='system administrator'  limit 1];
        System.runas(usr)
        {
            account acctest= (account)SObjectFactory.create(
                account.sObjectType, new Map<Schema.SObjectField, Object>
                {
                    account.Name => 'Test Account New',
                        account.Customer_Status__c => 'Active',
                        account.Strategic_Business_Unit__c => 'ATR',
                        account.CBT__c => 'Airlines',
                        account.Region_Name__c => 'Americas',
                        account.Sub_Region_Name__c => 'Canada',
                        account.Service_Level__c => 'Unauthorized Dist/Brkr',               
                        account.Type => 'OEM',
                        account.REPORT_ACCOUNT_NAME__c => 'Test Account New',
                        account.Market_Name__c => 'Marine'        
                        });                        
            Contact con = new Contact();
            con.accountId=acctest.Id;
            con.LastName = 'Nanjappan';
            con.FirstName = 'Nandini';
            con.Primary_Email_Address__c = 'nandini.nanjappan@nttdata.com';
            con.Email='nandini.nanjappan@nttdata.com';
            insert con;   
            Set<Id> setCasId= new Set<Id>();
            Id RecordtypeId = Schema.SObjectType.Case.getRecordTypeInfosByDeveloperName().get('Repair_Overhaul').getRecordTypeId(); 
            Case cs= new Case();
            cs.Origin = 'SAP Interface';
            cs.RecordTypeId = RecordtypeId;
            cs.Classification__c = 'R&O Issue';
            cs.ContactId = con.Id;
            cs.Type_of_Change__c = 'New Account';
            cs.Type = 'Other';
            cs.Export_Compliance_Content_ITAR_EAR__c = 'NO';
            cs.Government_Compliance_SM_M_Content__c = 'NO';  
            cs.OwnerId=label.aero_default_user_id;            
            insert cs; 
            
            CaseComment createComm = new CaseComment();
            createComm.CommentBody = 'TestComment';
            createComm.parentId = cs.Id;
            createComm.IsPublished = false;
            insert createComm;
            CaseComment_Extension__c createCustComm = new CaseComment_Extension__c();
            createCustComm.Classification__c = 'Manual';
            createCustComm.CaseCommentId__c = createComm.Id;
            insert createCustComm;
            
            map<String,String> caseCommInfo = new map<String,String>();
            Map<String,List<String>> allEmailAddr = new Map<String,List<String>>();
            caseCommInfo.put('CommentBody', 'TestComment');
            caseCommInfo.put('CaseId', cs.Id);
            caseCommInfo.put('IsPublic', 'true');
            caseCommInfo.put('Classification', 'Manual');
            caseCommInfo.put('CasCommentId', createComm.Id);
            
            list<string> emailAddr = new list<string>{'test@test.com','test1@test.com'};
            allEmailAddr.put('ToAddress',emailAddr);
            allEmailAddr.put('CcAddress',emailAddr);
            
            
            Test.startTest();
            CaseCommentsController.updateCaseComments(caseCommInfo, allEmailAddr);
            Test.stopTest();
        }
    }
    
    @isTest
    public static void TestMethod4(){
        User usr =[select id,firstname,lastname,name,FederationIdentifier,profileid from user where  isactive=true and profile.name='system administrator'  limit 1];
        System.runas(usr)
        {
            account acctest= (account)SObjectFactory.create(
                account.sObjectType, new Map<Schema.SObjectField, Object>
                {
                    account.Name => 'Test Account New',
                        account.Customer_Status__c => 'Active',
                        account.Strategic_Business_Unit__c => 'ATR',
                        account.CBT__c => 'Airlines',
                        account.Region_Name__c => 'Americas',
                        account.Sub_Region_Name__c => 'Canada',
                        account.Service_Level__c => 'Unauthorized Dist/Brkr',               
                        account.Type => 'OEM',
                        account.REPORT_ACCOUNT_NAME__c => 'Test Account New',
                        account.Market_Name__c => 'Marine'        
                        });                        
            Contact con = new Contact();
            con.accountId=acctest.Id;
            con.LastName = 'Nanjappan';
            con.FirstName = 'Nandini';
            con.Primary_Email_Address__c = 'nandini.nanjappan@nttdata.com';
            con.Email='nandini.nanjappan@nttdata.com';
            insert con;   
            Set<Id> setCasId= new Set<Id>();
            Id RecordtypeId = Schema.SObjectType.Case.getRecordTypeInfosByDeveloperName().get('Repair_Overhaul').getRecordTypeId(); 
            Case cs= new Case();
            cs.Origin = 'SAP Interface';
            cs.RecordTypeId = RecordtypeId;
            cs.Classification__c = 'R&O Issue';
            cs.ContactId = con.Id;
            cs.Type_of_Change__c = 'New Account';
            cs.Type = 'Other';
            cs.Export_Compliance_Content_ITAR_EAR__c = 'NO';
            cs.Government_Compliance_SM_M_Content__c = 'NO';  
            cs.OwnerId=label.aero_default_user_id;            
            insert cs; 
            
            CaseComment createComm = new CaseComment();
            createComm.CommentBody = 'TestComment';
            createComm.parentId = cs.Id;
            createComm.IsPublished = false;
            insert createComm;
            CaseComment_Extension__c createCustComm = new CaseComment_Extension__c();
            createCustComm.Classification__c = 'Manual';
            createCustComm.CaseCommentId__c = createComm.Id;
            insert createCustComm;
            
            Test.startTest();
            CaseCommentsController.deleteCaseComment(createComm.Id);
            Test.stopTest();
        }
    }
}