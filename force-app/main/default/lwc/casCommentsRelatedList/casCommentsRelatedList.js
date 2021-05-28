import { LightningElement,track,wire,api } from 'lwc';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getCaseComments from '@salesforce/apex/CaseCommentsController.getCaseComments';
import createCaseComments from '@salesforce/apex/CaseCommentsController.createCaseComments';
import deleteCaseComment from '@salesforce/apex/CaseCommentsController.deleteCaseComment';
import updateCaseComments from '@salesforce/apex/CaseCommentsController.updateCaseComments';

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
    {label: 'Public', fieldName: 'IsPublic', type: 'boolean'},
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
    
    curCasCommIdToDel;
    curCasCommRecord = {'Classification':'','CommentBody':'','IsPublic':''};

    @track showErrorOnPage = false;
    @track showErrorOnModal = false;

    @track toAddress;
    @track ccAddress;
    @track bccAddress;
    @track invalidEmailAddr=[];

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
                this.showErrorOnPage = true;
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
        this.record = {'Classification':'','CommentBody':'','Title':'New Case Comment','IsPublic':false};
        this.openModal = true;
        
        //clearing existing data while clikcing new button
        this.invalidEmailAddr.splice(0,this.invalidEmailAddr.length);
        this.toAddress = undefined;
        this.ccAddress = undefined;
        this.bccAddress = undefined;        
    }    

    handleFieldChange(e) {
        if(e.currentTarget.name!='IsPublic'){
            this.record[e.currentTarget.name] = e.target.value;
        }else{
            this.record[e.currentTarget.name] = e.target.checked;
        }
        console.log('this.record[e.currentTarget.name]: '+e.currentTarget.name);
        console.log('e.target.value: '+e.target.value);
        console.log(JSON.stringify(this.record));
    }

    saveModalAction(){       
        this.invalidEmailAddr.splice(0,this.invalidEmailAddr.length); 
        if(this.toAddress!=undefined)
            this.checkValidEmail(this.toAddress);
        if(this.ccAddress!=undefined)
            this.checkValidEmail(this.ccAddress);
        if(this.bccAddress!=undefined)
            this.checkValidEmail(this.bccAddress);
        
        const isInputsCorrect = [...this.template.querySelectorAll('.valCmp')]
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);

        if(this.invalidEmailAddr.length==0){
            this.showErrorOnModal = false;
            if(isInputsCorrect){            
                console.log('all valid');
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
                        this.showModalLoading = false;
                        this.showErrorOnModal = true;
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
        }else{
            console.log('invalid in save: '+JSON.stringify(this.invalidEmailAddr) );
            this.error = `${this.invalidEmailAddr} not a valid email address`;
            this.showErrorOnModal = true;
        }
    }

    closeModalAction(){
        this.openModal = false;
        this.showErrorOnModal = false;
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
        this.curCasCommRecord = {'Classification':'','CommentBody':'','IsPublic':''};
    }

    handleFieldChangeEdit(e){
        console.log('e.currentTarget.name: '+e.currentTarget.name);
        console.log('e.target.value: '+e.target.value);
        if(e.currentTarget.name!='IsPublic'){
            this.curCasCommRecord[e.currentTarget.name] = e.target.value;
        }else{
            this.curCasCommRecord[e.currentTarget.name] = e.target.checked;
        }        
        console.log('this.curCasCommRecord: '+JSON.stringify(this.curCasCommRecord));
    }

    closeModalActionForEdit(){
        this.openModalForEdit = false;
        this.showErrorOnModal = false;
    }

    EditModalAction(){
        const isEditInputsCorrect = [...this.template.querySelectorAll('.valEditCmp')]
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);
        if(isEditInputsCorrect){
            this.showModalLoading = true;
            this.curCasCommRecord['CasCommentId'] = this.recordEdit['CasCommentId'];
            if(this.curCasCommRecord['Classification'] == '')
                this.curCasCommRecord['Classification'] = this.recordEdit['Classification'];
            if(this.curCasCommRecord['CommentBody'] == '')
                this.curCasCommRecord['CommentBody'] = this.recordEdit['CommentBody'];
            if(this.curCasCommRecord['IsPublic'] == '')
                this.curCasCommRecord['IsPublic'] = this.recordEdit['IsPublic'];

            console.log('record to update: '+JSON.stringify(this.curCasCommRecord));
            updateCaseComments({ caseCommInfo: this.curCasCommRecord })
                .then(result => {                
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Case Comment was saved.',
                            variant: 'success'
                        })
                    );
                    this.showModalLoading = false;
                    this.closeModalActionForEdit();
                    this.initFetch();
                })
                .catch(error => {
                    this.error = error;
                    this.data = undefined;
                    this.showModalLoading = false;
                    this.showErrorOnModal = true;
                    // UI API read operations return an array of objects
                    if (Array.isArray(error.body)) {
                        this.error = error.body.map(e => e.message).join(', ');
                    } 
                    // UI API write operations, Apex read and write operations 
                    // and network errors return a single object
                    else if (typeof error.body.message === 'string') {
                        this.error = error.body.message;
                    }
                    console.log('Error Inside EditModalAction'+this.error);
                });
        }
    }

    deleteCurrentRecord(currentRow){
        this.openModalForDel =true;
        this.curCasCommIdToDel = currentRow.CasCommentId;
    }

    closeModalActionForDel(){
        this.openModalForDel =false;
        this.showErrorOnModal = false;
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
                this.showModalLoading = false;
                this.showErrorOnModal = true;
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

    emailToSelectionHandler(event){
        console.log('Selected Record Value on Parent Component To is ' +  JSON.stringify(event.detail.selectedRecord));
        this.toAddress = event.detail.selectedRecord;        
    }

    emailCcSelectionHandler(event){
        console.log('Selected Record Value on Parent Component CC is ' +  JSON.stringify(event.detail.selectedRecord));
        this.ccAddress = event.detail.selectedRecord;
    }

    emailBccSelectionHandler(event){
        console.log('Selected Record Value on Parent Component Bcc is ' +  JSON.stringify(event.detail.selectedRecord));
        this.bccAddress = event.detail.selectedRecord;
    }
    
    checkValidEmail(emailAddrs){
        let regExpEmailformat = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;          
        let invalidAddr = [];
        let allValidEmails = true;
        emailAddrs.forEach(addr =>  {
            if(addr!=null && addr!=undefined && !addr.match(regExpEmailformat)){
                invalidAddr.push(addr);
                console.log('invalidAddr: '+invalidAddr);
                this.invalidEmailAddr.push(addr);                
            }                
        });
        if(this.invalidEmailAddr.length>0)
            allValidEmails = false;
        console.log('Invalid Emails: '+this.invalidEmailAddr);
        return allValidEmails;
    }
   
}