import { LightningElement, api, track } from 'lwc';
import search from '@salesforce/apex/CustomLookupController.search';
export default class CustomLookup extends LightningElement {
    @api objectName;
    fieldName = ['Name','Email'];
    @api iconName;
    @api label;
    @api placeholder;
    @api uniqueName;
    @api className;
    @api required = false;
    @track searchString;
    @track selectedRecord= [];
    @track recordsList;
    @track message;
    @track showPill = false;
    @track showSpinner = false;
    @track showDropdown = false;
 
    connectedCallback() {
        
    }
 
    searchRecords(event) {
        this.searchString = event.target.value;
        if(this.searchString) {
            this.fetchData();
        } else {
            this.showDropdown = false;
        }
    }
 
    selectItem(event) {
        if(event.currentTarget.dataset.key) {
    		var index = this.recordsList.findIndex(x => x.Id === event.currentTarget.dataset.key)
            if(index != -1) {
                console.log('this.selectedRecord : '+this.selectedRecord);
                if(!this.selectedRecord.some(code => code.Email === this.recordsList[index].Email))
                    this.selectedRecord.push(this.recordsList[index]);
                console.log('this.selectedRecord1 : '+this.selectedRecord);
                this.showDropdown = false;
                this.showPill = true;
                this.emailAddressSelectionHandler(this.selectedRecord);
            }
        }
    }

    emailAddressSelectionHandler(value){ 
        console.log('uniqueName: '+this.uniqueName);
        let emailAddr = [];
        value.forEach(addr =>{
            emailAddr.push(addr.Email);
        });
        if(this.uniqueName=='ToAddress'){
            const toAddr = new CustomEvent('emailtoselection',{
                'detail': {selectedRecord: emailAddr}
            });
            this.dispatchEvent(toAddr);
        }else if(this.uniqueName=='CcAddress'){
            const ccAddr = new CustomEvent('emailccselection',{
                'detail': {selectedRecord: emailAddr}
            });
            this.dispatchEvent(ccAddr);
        }else if(this.uniqueName=='BccAddress'){
            const bccAddr = new CustomEvent('emailbccselection',{
                'detail': {selectedRecord: emailAddr}
            });
            this.dispatchEvent(bccAddr);
        }
    }

    selectManualItem(event){
        if(event.currentTarget.dataset.key) {
            console.log('Key: '+event.currentTarget.dataset.key);
            let manualAddress ={};
            if(!this.selectedRecord.some(code => code.Email === event.currentTarget.dataset.key)){
                manualAddress={
                    'Id': event.currentTarget.dataset.key,
                    'Name': event.currentTarget.dataset.key,
                    'Email': event.currentTarget.dataset.key,
                    'IsManual':true
                };                
                this.selectedRecord.push(manualAddress);
                this.showPill = true;
            }            
            console.log('selectManualItemEntered : '+this.selectedRecord);
            this.emailAddressSelectionHandler(this.selectedRecord);
        }
    }
 
    removeItem(event) {
        console.log('name: '+event.target.name);
        let removeItem = event.target.name;
        var index = this.selectedRecord.findIndex(x => x.Id === event.target.name);
        if(index != -1) {
            this.selectedRecord.splice(index, 1);
        }
        if(this.selectedRecord.length==0)
            this.showPill = false;
        this.emailAddressSelectionHandler(this.selectedRecord);
    }
 
    showRecords() {
        if(this.recordsList && this.searchString) {
            this.showDropdown = true;
        }
    }
 
    blurEvent() {
        this.showDropdown = false;
    }

    fetchData() {
        this.showSpinner = true;
        this.message = '';
        this.recordsList = [];
        search({
            objectName : this.objectName,
            filterField : this.fieldName,
            searchString : this.searchString
        })
        .then(result => {
            if(result && result.length > 0) {
                let stringResult = JSON.stringify(result);
                let allResult    = JSON.parse(stringResult);
                this.recordsList = allResult;
                console.log('recordsList: '+this.recordsList);
                this.showDropdown = true;                
            } else {
                this.message = this.searchString;
            }
            this.showSpinner = false;
        }).catch(error => {
            this.message = error.message;
            this.showSpinner = false;
        })        
    }
}