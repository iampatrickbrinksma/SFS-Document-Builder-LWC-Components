import { LightningElement, api, wire } from 'lwc';

// GraphQL support
import { gql, graphql } from "lightning/uiGraphQLApi";

// UI API
import { getRecord, getRecords } from "lightning/uiRecordApi";
import { getObjectInfo } from "lightning/uiObjectInfoApi";

// Data model: Service Appointment
import OBJ_SA from "@salesforce/schema/ServiceAppointment";
import FLD_SA_PARENTRECORDID from "@salesforce/schema/ServiceAppointment.ParentRecordId";

// Data model: Work Order
import OBJ_WO from "@salesforce/schema/WorkOrder";

// Data Mode: ContentDocument
import FLD_CD_ID from '@salesforce/schema/ContentDocument.Id';
import FLD_CD_FILETYPE from '@salesforce/schema/ContentDocument.FileType';
import FLD_CD_TITLE from '@salesforce/schema/ContentDocument.LatestPublishedVersion.Title';
import FLD_CD_DESC from '@salesforce/schema/ContentDocument.LatestPublishedVersion.Description';
import FLD_CD_VERSIONDATAURL from '@salesforce/schema/ContentDocument.LatestPublishedVersion.VersionDataUrl';


export default class ImgGallery extends LightningElement {

    @api recordId;
    @api galleryHeading;
    @api numOfColumns;

    // Work Order Images
    woImages;

    // Object fields;
    _contentDocumentFields = [
        FLD_CD_ID,
        FLD_CD_TITLE,
        FLD_CD_DESC,
        FLD_CD_FILETYPE,
        FLD_CD_VERSIONDATAURL
    ];

    // Object key prefix
    _saPrefix;
    get saPrefix(){
        return this._saPrefix;
    }
    set saPrefix( value ){
        this._saPrefix = value;
        this.setRecordContext();
    }
    
    _woPrefix;
    get woPrefix(){
        return this._woPrefix;
    }
    set woPrefix( value ){
        this._woPrefix = value;
        this.setRecordContext();
    }

    // Record Ids
    _saId;
    _woId;
    _linkedEntityId;

    // Work Order
    _wo;

    // Content Document Ids
    _contDocIds;

    // Content Document Get Records Variables
    _contentDocsGetRecordsVars;

    setRecordContext(){
        if ( this.recordId && this.saPrefix && this.woPrefix ) {
            let idPrefix = this.recordId.substring( 0, 3 );
            if ( idPrefix === this._saPrefix ) {
                this._saId = this.recordId;
            } 
            else if ( idPrefix === this._woPrefix ) {
                this._woId = this.recordId;
            }       
        } 
    }

    @wire( getObjectInfo, { objectApiName: OBJ_SA } )
    getSAObjectInfo( { data, error } ) {
        console.log( `getSAObjectInfo callback for Object: ${ OBJ_SA.objectApiName }` );
        if ( data ) {
            this.saPrefix = data.keyPrefix;
            console.log( `getSAObjectInfo keyPrefix: ${ this._saPrefix }` );
        }
        if ( error ) {
            console.log( `getSAObjectInfo error: ${ JSON.stringify( error ) }` );            
        }
    } 
    
    @wire( getObjectInfo, { objectApiName: OBJ_WO } )
    getWPObjectInfo( { data, error } ) {
        console.log( `getWPObjectInfo callback for Object: ${ OBJ_WO.objectApiName }` );
        if ( data ) {
            this.woPrefix = data.keyPrefix;
            console.log( `getWPObjectInfo keyPrefix: ${ this._woPrefix }` );
        }
        if ( error ) {
            console.log( `getWPObjectInfo error: ${ JSON.stringify( error ) }` );            
        }
    }     

    @wire( getRecord, { recordId: "$_saId", fields: [ FLD_SA_PARENTRECORDID ] } )
    getSARecordResult( { error, data } ){
        if ( data ) {
            console.log( `getSARecordResult data: ${JSON.stringify( data) }` );
            this._woId = data.fields.ParentRecordId.value;
        }
        if ( error ) {
            console.log( `getSARecordResult error: ${JSON.stringify( error) }` );
        }
    }

    // Wire for ContentDocuments related to Work Step
    @wire(graphql, { query: '$woFilesQuery', variables: '$woFilesQueryVars' } )
    WOFilesQueryResults( result ) {
        console.log( `WOFilesQueryResults callback for Work Order Id: ${ this._woId }` );
        const { data, error } = result;
        if ( data ) {
            console.log( `WOFilesQueryResults data retrieved: ${ JSON.stringify( data ) }` );
            this._contDocLinks = data.uiapi.query.ContentDocumentLink.edges.map( ( edge ) => edge.node );
            let contDocIds = [];
            this._contDocLinks.forEach( ( contDocLink ) => {
                if ( contDocLink.ContentDocument?.Id ){
                    contDocIds.push( contDocLink.ContentDocument.Id );
                } 
            } );
            this._contDocIds = contDocIds;
            if ( contDocIds.length > 0 ) {
                this._contentDocsGetRecordsVars = [ { recordIds: this._contDocIds, fields: this._contentDocumentFields } ];
            }                
        }
        if ( error ) {
            console.log( `WOFilesQueryResults Error: ${ JSON.stringify( error ) }` );            
        }
    }

    // Getter for graphql query to control when the wire is triggered
    get woFilesQuery(){
        if ( !this._woId ) return undefined;
        return gql`
            query woFilesQuery( $linkedEntityId: ID = "" ) {
                uiapi {
                    query {
                        ContentDocumentLink(
                            where: { LinkedEntityId: { eq: $linkedEntityId } }
                            first: 2000
                        ) {
                            edges {
                                node {
                                    Id
                                    ContentDocument {
                                        Id
                                        LatestPublishedVersion {
                                            Id
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;
    }    

    // Variable for the graphQL query
    get woFilesQueryVars(){
        return {
            linkedEntityId: this._woId
        };
    } 

    // Get Content Document Records
    @wire( getRecords, { records: "$_contentDocsGetRecordsVars" } )
    contentDocumentsResult( { data, error } ) {
        console.log( `contentDocumentsResult callback for Id: ${ JSON.stringify( this._contDocIds ) }` );
        if ( data ) {
            console.log( `contentDocumentsResult data retrieved: ${ JSON.stringify( data ) }` );
            let woImgs = [];
            data.results.map( ( result ) => {
                let fileType = result.result.fields.FileType.value.toLowerCase();
                if ( fileType.match(/(jpg|jpeg|png|gif)$/i) ) {
                    woImgs.push(
                        { 
                            Id: result.result.id, 
                            Title: result.result.fields.LatestPublishedVersion.value.fields.Title.value,
                            Desc: result.result.fields.LatestPublishedVersion.value.fields.Description.value,
                            FileType: fileType,
                            VersionDataUrl: result.result.fields.LatestPublishedVersion.value.fields.VersionDataUrl.value 
                        } 
                    );
                }
            });
            this.woImages = woImgs;
            console.log( `contentDocumentsResult woImages: ${ JSON.stringify( this.woImages ) }` );
        }
        if ( error ) {
            // TODO: Error to screen
            console.log( `contentDocumentsResult Error: ${ JSON.stringify( error ) }` );                    
        }
    }      

    get imgColClass(){
        return `slds-col slds-size_1-of-${this.numOfColumns} slds-var-p-around_small`;
    }

    // Get fields from object Info
    objectFields( objectFields, objectType ) {
        let keys = Object.keys( objectFields );
        let fields = keys.map( ( f ) => {
            return `${ objectType }.${ f }`;
        });
        return fields;
    }


}