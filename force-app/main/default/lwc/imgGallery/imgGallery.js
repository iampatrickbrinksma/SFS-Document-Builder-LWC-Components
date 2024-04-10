import { LightningElement, api, wire } from 'lwc';

// GraphQL support
import { gql, graphql } from "lightning/uiGraphQLApi";

// UI API
import { getRecord, getRecords } from "lightning/uiRecordApi";

// Data model: Service Appointment
import FLD_SA_PARENTRECORDID from "@salesforce/schema/ServiceAppointment.ParentRecordId";

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

    // Work Order Id
    _parentRecordId;

    // Work Order
    _wo;

    // Content Document Ids
    _contDocIds;

    // Content Document Get Records Variables
    _contentDocsGetRecordsVars;
    
    constructor(){
        super();
        if ( this.numOfColumns < 1 ) {
            this.numOfColumns = 1;
        } 
        else if ( this.numOfColumns > 12 ) {
            this.numOfColumns = 12;
        }
    }

    @wire( getRecord, { recordId: "$recordId", fields: [ FLD_SA_PARENTRECORDID ] } )
    getSARecordResult( { error, data } ){
        if ( data ) {
            console.log( `getSARecordResult data: ${JSON.stringify( data) }` );
            this._parentRecordId = data.fields.ParentRecordId.value;
        }
        if ( error ) {
            console.log( `getSARecordResult error: ${JSON.stringify( error) }` );
        }
    }

    // Wire for ContentDocuments related to Work Step
    @wire(graphql, { query: '$woFilesQuery', variables: '$woFilesQueryVars' } )
    WOFilesQueryResults( result ) {
        console.log( `WOFilesQueryResults callback for Work Order Id: ${ this._parentRecordId }` );
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
        if ( !this._parentRecordId ) return undefined;
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
            linkedEntityId: this._parentRecordId
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