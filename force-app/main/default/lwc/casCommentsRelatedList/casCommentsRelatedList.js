import { LightningElement,track,wire,api } from 'lwc';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getCaseComments from '@salesforce/apex/CaseCommentsController.getCaseComments';
import createCaseComments from '@salesforce/apex/CaseCommentsController.createCaseComments';
import deleteCaseComment from '@salesforce/apex/CaseCommentsController.deleteCaseComment';
import fetchEmailAddrFromCase from '@salesforce/apex/CaseCommentsController.fetchEmailAddrFromCase';

//To get picklist values
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import CLASSIFICATION_FIELD from '@salesforce/schema/CaseComment_Extension__c.Classification__c';

import { getRecord } from 'lightning/uiRecordApi';

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
    @track recordEdit;
    @track error;
    @api recordId;
    @track isLoading = false;
    @track openModal =false;
    @track openModalForEdit =false;
    @track openModalForDel =false;
    @track showModalLoading=false;
    @track isNoDataFound =false;

    @track classsifyPickList;
    //@track value;
    @track dualBoxValues=[
        { label: 'English', value: 'en' },
        { label: 'German', value: 'de' },
        { label: 'Spanish', value: 'es' },
        { label: 'French', value: 'fr' },
        { label: 'Italian', value: 'it' },
        { label: 'Japanese', value: 'ja' },
    ];

    curCasCommIdToDel;
    @track curCasCommRecord = {'Classification':'','CommentBody':''};
    @track emailAddressFrmCase=[];


    connectedCallback() {
        //this.initFetch();
    }

    @wire(getRecord, { recordId: '$recordId', fields: [ 'Case.Id'] })
    getaccountRecord({ data, error }) {
        console.log('caseRecord => ', data, error);
        if (data) {
            this.initFetch();
        } else if (error) {
            console.error('ERROR => ', JSON.stringify(error)); // handle error properly
        }
    }

    initFetch(){
        this.isLoading = true;
        console.log('recordId: '+this.recordId);
        getCaseComments({ caseId: this.recordId })
            .then(result => {
                console.log('initFetch data: '+JSON.parse(result));
                if(JSON.parse(result).length==0){
                    this.isNoDataFound = true;
                    console.log('Inside the length method '+this.isNoDataFound);
                }else{
                    this.isNoDataFound = false;
                }
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
        this.fetchEmailAddress();
    }

    fetchEmailAddress(){
        this.showModalLoading = true;
        console.log('fetchEmailAddress recordId: '+this.recordId);
        fetchEmailAddrFromCase({ caseId: this.recordId })
            .then(result => {
                const items = [];
                this.emailAddressFrmCase=[];
                console.log('fetchEmailAddress data: '+result);
                result.forEach(function(acc){
                    items.push({
                        label: acc,
                        value: acc,
                    });
                });
                this.emailAddressFrmCase.push(...items);
                console.log('emailAddressFrmCase: '+this.emailAddressFrmCase);
                console.log('emailAddressFrmCase1: '+JSON.stringify(this.emailAddressFrmCase) );
                this.showModalLoading = false;
            })
            .catch(error => {
                this.error = error;
                this.data = undefined;
                this.showModalLoading = false;
                // UI API read operations return an array of objects
                /*if (Array.isArray(error.body)) {
                    this.error = error.body.map(e => e.message).join(', ');
                } 
                // UI API write operations, Apex read and write operations 
                // and network errors return a single object
                else if (typeof error.body.message === 'string') {
                    this.error = error.body.message;
                }*/
                console.log('Error Inside fetchEmailAddress'+this.error);
            });

    }

    handleFieldChange(e) {
        this.record[e.currentTarget.name] = e.target.value;
        //console.log('this.record[e.currentTarget.name]: '+this.record[e.currentTarget.name]);
        //console.log(JSON.stringify(this.record));
    }

    saveModalAction(){
        this.showModalLoading = true;
        this.record['CaseId'] = this.recordId;
        console.log('record to save: '+this.record);
        createCaseComments({ caseCommInfo: this.record })
            .then(result => {                
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Case Comment was created.',
                        variant: 'success'
                    })
                );
                this.showModalLoading = false;
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
        this.recordEdit = currentRow;
        this.recordEdit['Title'] = 'Edit Case Comment';
        console.log('currentRow: '+JSON.stringify(currentRow));
        this.openModalForEdit = true;

    }

    handleFieldChangeEdit(e){
        console.log('e.currentTarget.name: '+e.currentTarget.name);
        console.log('e.target.value: '+e.target.value);
        this.curCasCommRecord[e.currentTarget.name] = e.target.value;
        console.log('this.curCasCommRecord: '+this.curCasCommRecord);
    }

    closeModalActionForEdit(){
        this.openModalForEdit = false;
    }

    EditModalAction(){
        console.log('curCasCommRecord: '+this.curCasCommRecord);

    }

    deleteCurrentRecord(currentRow){
        this.openModalForDel =true;
        this.curCasCommIdToDel = currentRow.CasCommentId;
    }

    closeModalActionForDel(){
        this.openModalForDel =false;
    }

    deleteModalAction(){
        console.log('Case Comment Id: '+this.curCasCommIdToDel);
        this.showModalLoading = true;
        deleteCaseComment({ caseCommId: this.curCasCommIdToDel })
            .then(result => {                
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Case Comment was deleted.',
                        variant: 'success'
                    })
                );
                this.showModalLoading = false;
                this.closeModalActionForDel();
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
                console.log('Error Inside deleteModalAction'+this.error);
            });

    }

   
}