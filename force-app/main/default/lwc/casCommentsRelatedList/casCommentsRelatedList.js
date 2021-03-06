import { LightningElement,track,wire,api } from 'lwc';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getCaseComments from '@salesforce/apex/CaseCommentsController.getCaseComments';
import createCaseComments from '@salesforce/apex/CaseCommentsController.createCaseComments';
import deleteCaseComment from '@salesforce/apex/CaseCommentsController.deleteCaseComment';
import updateCaseComments from '@salesforce/apex/CaseCommentsController.updateCaseComments';
import getFilterSearchCaseComments from '@salesforce/apex/CaseCommentsController.getFilterSearchCaseComments';

//To get picklist values
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import CLASSIFICATION_FIELD from '@salesforce/schema/CaseComment_Extension__c.Classification__c';

import { getRecord } from 'lightning/uiRecordApi';
import hasCasCommPerm from '@salesforce/customPermission/Case_Comments_Custom_Permission';

// row actions
const actions = [            
    { label: 'Edit', name: 'edit'}, 
    { label: 'Delete', name: 'delete'}
];

// datatable columns with row actions
const columns = [
    {label: 'User', fieldName: 'createByName', type: 'text',initialWidth: 160},
    {label: 'Public', fieldName: 'IsPublic', type: 'boolean',initialWidth: 70},
    {label: 'File', fieldName: 'HasAttachment', type: 'boolean',initialWidth: 40},
    {label: 'Created Date', fieldName: 'CreatedDate', type: 'text',initialWidth: 160},
    {label: 'Comment Type', fieldName: 'Classification', type: 'text',initialWidth: 160},
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
    mapAllAddress={'ToAddress':null,'CcAddress':null,'BccAddress':null};

    @track toAddressEdit=[];
    @track ccAddressEdit=[];
    @track bccAddressEdit=[];

    @track userDrpDwn= [];
    @track publicDrpDwn= [];
    @track commTypeDrpDwn= [];
    @track filterRecord={'FilterComType':'','FilterUser':'','FilterPublic':null,'FromDate':'','ToDate':''};

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
                this.userDrpDwn =[];
                this.commTypeDrpDwn =[];
                for (var dataVal in this.data) {
                    let userName = this.data[dataVal].createByName;
                    let commTypeName = this.data[dataVal].Classification;
                    if(userName!=null && userName!=undefined){
                        if(!this.userDrpDwn.some(code => code.label === userName)){
                            let userObj ={};
                            userObj = this.prepareDrpDwnVal(userName);
                            this.userDrpDwn.push(userObj);
                        }                        
                    }
                    if(commTypeName!=null && commTypeName!=undefined){
                        if(!this.commTypeDrpDwn.some(code => code.label === commTypeName)){
                            let comTypeObj ={};
                            comTypeObj = this.prepareDrpDwnVal(commTypeName);
                            this.commTypeDrpDwn.push(comTypeObj);
                        }                        
                    }
                }
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
    get isSetupEnabled() {
        return hasCasCommPerm==true? true : false;
    }

    prepareDrpDwnVal(filterVal){        
        let prepareAddress ={};
        prepareAddress={            
            'label': filterVal,
            'value': filterVal
        };
        return prepareAddress;
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

    get classifyManualOptions() {
        return [
            { label: 'Manual', value: 'Manual' },
            { label: 'CSM/CSPM/CBM Info', value: 'CSM/CSPM/CBM Info' }
        ];
    }

    get publicDrpDownOptions() {
        return [
            { label: 'True', value: 'True' },
            { label: 'False', value: 'False' }
        ];
    }

    handleRefreshRecord(){
        this.initFetch();
    }

    handleCreateRecord(){                
        this.record = {'Classification':'Manual','CommentBody':'','Title':'New Case Comment','IsPublic':false};
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

    handleFilterSearchChange(e) {
        this.filterRecord[e.currentTarget.name] = e.target.value;  
        console.log('this.filterRecord[e.currentTarget.name]: '+e.currentTarget.name);
        console.log('e.target.value: '+e.target.value);
        console.log(JSON.stringify(this.filterRecord));
    }

    clrFilterSearch(){
        this.filterRecord={'FilterComType':'','FilterUser':'','FilterPublic':null,'FromDate':null,'ToDate':null};
        this.initFetch();
    }

    filterSearchClick(){ 
        this.isLoading = true;
        let filterComTypeVal = this.filterRecord['FilterComType'];
        let filterUserVal = this.filterRecord['FilterUser'];
        let filterPublicVal = this.filterRecord['FilterPublic']!=null ? this.filterRecord['FilterPublic'].toLowerCase() == 'true' ? true : false : null;
        let filterFromDtVal = this.filterRecord['FromDate']=="" ? null: this.filterRecord['FromDate'];
        let filterToDtVal = this.filterRecord['ToDate']=="" ? null: this.filterRecord['ToDate'];
        
        getFilterSearchCaseComments({ casId: this.recordId,userName: filterUserVal,commType:filterComTypeVal,isPublic:filterPublicVal,startDt:filterFromDtVal,endDt:filterToDtVal})
            .then(result => {
                console.log('getFilterSearchCaseComments data: '+JSON.parse(result));
                if(JSON.parse(result).length==0){
                    this.isNoDataFound = true;
                    console.log('Inside the getFilterSearchCaseComments length method '+this.isNoDataFound);
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
                console.log('Error Inside getFilterSearchCaseComments'+this.error);
            });
    }

    saveModalAction(){       
        /*this.invalidEmailAddr.splice(0,this.invalidEmailAddr.length);
        this.mapAllAddress={'ToAddress':null,'CcAddress':null,'BccAddress':null}; 
        if(this.toAddress!=undefined){
            this.checkValidEmail(this.toAddress);
            this.mapAllAddress['ToAddress']=this.toAddress;
        }            
        if(this.ccAddress!=undefined){
            this.checkValidEmail(this.ccAddress);
            this.mapAllAddress['CcAddress']=this.ccAddress;
        }            
        if(this.bccAddress!=undefined){
            this.checkValidEmail(this.bccAddress);
            this.mapAllAddress['BccAddress']=this.bccAddress;
        }            
        console.log('All address: '+JSON.stringify(this.mapAllAddress));
        let isToAddressAdded = true;
        if(this.record['IsPublic'] && (this.toAddress==undefined || this.toAddress==null || this.toAddress.length==0)){
            isToAddressAdded = false;
        }else{
            isToAddressAdded = true;
        }*/
        const isInputsCorrect = [...this.template.querySelectorAll('.valCmp')]
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);

        //if(this.invalidEmailAddr.length==0 && isToAddressAdded){
            this.showErrorOnModal = false;
            if(isInputsCorrect){            
                console.log('all valid');
                this.showModalLoading = true;
                this.record['CaseId'] = this.recordId;
                console.log('record to save: '+this.record);
                createCaseComments({ caseCommInfo: this.record,allEmailAddr: this.mapAllAddress })
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
        /*}else if(!isToAddressAdded){
            this.error = `To Address is mandatory if Public checked`;
            this.showErrorOnModal = true;
        }else{
            console.log('invalid in save: '+JSON.stringify(this.invalidEmailAddr) );
            this.error = `${this.invalidEmailAddr} not a valid email address`;
            this.showErrorOnModal = true;
        }*/
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
        this.curCasCommRecord = {'Classification':'','CommentBody':'','IsPublic':null};

        this.toAddressEdit = this.recordEdit['CasCommToAddr'];
        this.ccAddressEdit = this.recordEdit['CasCommCcAddr'];
        this.bccAddressEdit = this.recordEdit['CasCommBccAddr'];
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
        this.invalidEmailAddr.splice(0,this.invalidEmailAddr.length);
        this.mapAllAddress={'ToAddress':null,'CcAddress':null,'BccAddress':null}; 
        if(this.toAddressEdit!=undefined){
            this.checkValidEmail(this.toAddressEdit);
            this.mapAllAddress['ToAddress']=this.toAddressEdit;
        }            
        if(this.ccAddressEdit!=undefined){
            this.checkValidEmail(this.ccAddressEdit);
            this.mapAllAddress['CcAddress']=this.ccAddressEdit;
        }            
        if(this.bccAddressEdit!=undefined){
            this.checkValidEmail(this.bccAddressEdit);
            this.mapAllAddress['BccAddress']=this.bccAddressEdit;
        }            
        console.log('All address: '+JSON.stringify(this.mapAllAddress));
        const isEditInputsCorrect = [...this.template.querySelectorAll('.valEditCmp')]
            .reduce((validSoFar, inputField) => {
                inputField.reportValidity();
                return validSoFar && inputField.checkValidity();
            }, true);
        if(this.invalidEmailAddr.length==0){
            this.showErrorOnModal = false;
            if(isEditInputsCorrect){                
                this.curCasCommRecord['CasCommentId'] = this.recordEdit['CasCommentId'];
                if(this.curCasCommRecord['Classification'] == '')
                    this.curCasCommRecord['Classification'] = this.recordEdit['Classification'];
                if(this.curCasCommRecord['CommentBody'] == '')
                    this.curCasCommRecord['CommentBody'] = this.recordEdit['CommentBody'];
                if(this.curCasCommRecord['IsPublic'] == null)
                    this.curCasCommRecord['IsPublic'] = this.recordEdit['IsPublic'];
    
                console.log('record to update: '+JSON.stringify(this.curCasCommRecord));
                let isToAddressAdded = true;
                if(this.curCasCommRecord['IsPublic'] && (this.toAddressEdit==undefined || this.toAddressEdit==null || this.toAddressEdit.length==0)){
                    isToAddressAdded = false;
                }else{
                    isToAddressAdded = true;
                }
                if(isToAddressAdded){
                    this.showModalLoading = true;
                    updateCaseComments({ caseCommInfo: this.curCasCommRecord,allEmailAddr: this.mapAllAddress })
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
                }else{
                    this.error = `To Address is mandatory if Public checked`;
                    this.showErrorOnModal = true;
                }                
            }
        }else{
            console.log('invalid in save: '+JSON.stringify(this.invalidEmailAddr) );
            this.error = `${this.invalidEmailAddr} not a valid email address`;
            this.showErrorOnModal = true;
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

    emailToSelectionEditHandler(event){
        console.log('Selected Record Value on Parent Component To is ' +  JSON.stringify(event.detail.selectedRecord));
        this.toAddressEdit = event.detail.selectedRecord;        
    }
    emailCcSelectionEditHandler(event){
        console.log('Selected Record Value on Parent Component To is ' +  JSON.stringify(event.detail.selectedRecord));
        this.ccAddressEdit = event.detail.selectedRecord;        
    }
    emailBccSelectionEditHandler(event){
        console.log('Selected Record Value on Parent Component To is ' +  JSON.stringify(event.detail.selectedRecord));
        this.bccAddressEdit = event.detail.selectedRecord;        
    }
    
    checkValidEmail(emailAddrs){
        let regExpEmailformat = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;          
        let invalidAddr = [];
        let allValidEmails = true;
        emailAddrs.forEach(addr =>  {
            if(addr!=null && addr!=undefined && !addr.trim().match(regExpEmailformat)){
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