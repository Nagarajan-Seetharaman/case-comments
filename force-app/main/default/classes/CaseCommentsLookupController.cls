public class CaseCommentsLookupController {
    public CaseCommentsLookupController() {

    }

    @AuraEnabled
    public static List<sObject> search(String objectName, List<String> filterField, String searchString){
        String searchKeyword = searchString + '*';
        String returningQuery = '';
        returningQuery = objectName+' ( Id, '+String.join(filterField,',')+')';
        String query = 'FIND :searchKeyword IN ALL FIELDS RETURNING '+returningQuery+' LIMIT 20';
        System.debug(' query '+query);
        List<List<sObject>> searchRecords = Search.Query(Query);
        return searchRecords.get(0);
    }
}
