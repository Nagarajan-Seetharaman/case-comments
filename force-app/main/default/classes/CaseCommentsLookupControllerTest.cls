@isTest
public class CaseCommentsLookupControllerTest {
    @isTest
    public static void TestMethod1(){
        User usr =[select id,firstname,lastname,name,FederationIdentifier,profileid from user where  isactive=true and profile.name='system administrator'  limit 1];
        System.runas(usr)
        {            
            String objectName ='Contact';
            List<String> filterField = new List<String>{'Name'};
            String searchString='test';
            Test.startTest();
            CaseCommentsLookupController.search(objectName, filterField, searchString);
            Test.stopTest();
        }
    }
}
