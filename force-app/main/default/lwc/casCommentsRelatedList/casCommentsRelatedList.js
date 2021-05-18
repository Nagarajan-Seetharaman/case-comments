import { LightningElement,track,wire,api } from 'lwc';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getCaseComments from '@salesforce/apex/CaseCommentsController.getCaseComments';
import createCaseComments from '@salesforce/apex/CaseCommentsController.createCaseComments';

//To get picklist values
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import CLASSIFICATION_FIELD from '@salesforce/schema/Case_Comment__c.Classification__c';

// row actions
const actions = [            
    { label: 'Edit', name: 'edit'}, 
    { label: 'Delete', name: 'delete'}
];

// datatable columns with row actions
const columns = [
    {label: 'User', fieldName: 'createByName', type: 'text'},
    {label: 'Created Date', fieldName: 'CreatedDate', type: 'text'},
    {label: 'Classification', fieldName: 'Classification', type: 'text'},
    {label: 'Comment', fieldName: 'CommentBody', type: 'text', wrapText:'true'},            
    {
        type: 'action',
        typeAttributes: {
            rowActions: actions,
            menuAlignment: 'auto'
        }
    }
];

export default class CasCommentsRelatedList extends LightningElement {
    // reactive variable
    @track data;
    @track columns = columns;
    @track record;
    @track error;
    @api recordId;
    @track isLoading = false;
    @track openModal =false;

    @track classsifyPickList;
    //@track value;


    connectedCallback() {
        this.initFetch();
    }

    initFetch(){
        this.isLoading = true;
        console.log('recordId: '+this.recordId);
        getCaseComments({ caseId: this.recordId })
            .then(result => {
                console.log('initFetch data: '+JSON.parse(result));
                this.data = JSON.parse(result);
                this.error = undefined;
                this.isLoading = false;
            })
            .catch(error => {
                this.error = error;
                this.data = undefined;
                this.isLoading = false;
                // UI API read operations return an array of objects
                if (Array.isArray(error.body)) {
                    this.error = error.body.map(e => e.message).join(', ');
                } 
                // UI API write operations, Apex read and write operations 
                // and network errors return a single object
                else if (typeof error.body.message === 'string') {
                    this.error = error.body.message;
                }
                console.log('Error Inside initFetch'+this.error);
            });

    }

    @wire(getPicklistValues, {
        fieldApiName: CLASSIFICATION_FIELD,
        recordTypeId: '012000000000000AAA'
    })
    wiredValues({ error, data }) {
        if (data) {
            this.classsifyPickList = data.values;
            this.error = undefined;
            console.log('getPicklistValues data: '+data.values);
        } else {
            this.error = error;
            this.classsifyPickList = undefined;            
            console.log('Error getPicklistValues eror'+this.error);
        }
    }

    handleRefreshRecord(){
        this.initFetch();
    }

    handleCreateRecord(){                
        this.record = {'Classification':'','CommentBody':'','Title':'New Case Comment'};
        this.openModal = true; 
    }

    handleFieldChange(e) {
        this.record[e.currentTarget.name] = e.target.value;
        //console.log('this.record[e.currentTarget.name]: '+this.record[e.currentTarget.name]);
        //console.log(JSON.stringify(this.record));
    }

    saveModalAction(){
        this.isLoading = true;
        this.record['CaseId'] = this.recordId;
        console.log('record to save: '+this.record);
        createCaseComments({ caseCommInfo: this.record })
            .then(result => {                
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Case Comment created',
                        variant: 'success'
                    })
                );
                this.isLoading = false;
                this.closeModalAction();
                this.initFetch();
            })
            .catch(error => {
                this.error = error;
                this.data = undefined;
                this.isLoading = false;
                // UI API read operations return an array of objects
                if (Array.isArray(error.body)) {
                    this.error = error.body.map(e => e.message).join(', ');
                } 
                // UI API write operations, Apex read and write operations 
                // and network errors return a single object
                else if (typeof error.body.message === 'string') {
                    this.error = error.body.message;
                }
                console.log('Error Inside saveModalAction'+this.error);
            });
    }

    closeModalAction(){
        this.openModal = false;
    }

    handleRowAction(event) {
        let actionName = event.detail.action.name;
        let row = event.detail.row; 
        switch (actionName) {            
            case 'edit':
                this.editCurrentRecord(row);
                break;
            case 'delete':
                this.deleteCurrentRecord(row);
                break;
        }
    }

    editCurrentRecord(currentRow) {
        this.record = currentRow;
        this.record['Title'] = 'Edit Case Comment';
        console.log('currentRow: '+JSON.stringify(currentRow));
        this.openModal = true;

    }

    deleteCurrentRecord(currentRow){

    }

   
}