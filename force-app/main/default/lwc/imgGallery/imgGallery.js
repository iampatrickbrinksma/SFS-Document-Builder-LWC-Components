import { LightningElement, api, wire } from 'lwc';

// GraphQL support
import { gql, graphql } from "lightning/uiGraphQLApi";

export default class ImgGallery extends LightningElement {

    // The record id will be dependent on the base object of the Document Builder Template
    // If it's a Service Appointment, and the getFilesFromParent is true, get the parent record first
    @api 
    get recordId() {
        return this._recordId;
    }
    set recordId( value ) {
        this._recordId = value;
        if ( this.getFilesFromParent && this._recordId.substring( 0, 3 ) === '08p' ) {
            this._saId = this._recordId;
            this._recordId = undefined;
        }
    }

    // Configurable at Document Builder Template level
    @api galleryHeading;
    @api getFilesFromParent;
    @api showImgTitle;
    @api showImgDesc;
    @api numOfColumns;
    @api 
    get cellAlignment() {
        return this._cellAlignment;
    }
    set cellAlignment( value ) {
        this._cellAlignment = value.toLowerCase();
    }

    // Images
    images = [];

    // Record Id
    _recordId;

    // Cell alignment
    _cellAlignment = 'top';

    // SA Record Id
    _saId;

    // Content Document Ids
    _contDocIds;

    // Indicator to get parent record (context: when SA record is used as basis of Service Document, files will be associated to parent record)
    _getParent = false;

    // Wire for Service Appointment
    @wire(graphql, { query: '$serviceAppointmentQuery', variables: '$serviceAppointmentQueryVars' } )
    serviceAppointmentQueryResults( result ) {
        console.log( `serviceAppointmentQueryResults callback for record Id: ${ this._saId }` );
        const { data, error } = result;
        if ( data ) {
            console.log( `serviceAppointmentQueryResults data retrieved: ${ JSON.stringify( data ) }` );
            let sas = data.uiapi.query.ServiceAppointment.edges.map( ( edge ) => edge.node );
            this._recordId = sas?.ParentRecordId?.value;
        }
        if ( error ) {
            console.log( `serviceAppointmentQueryResults Error: ${ JSON.stringify( error ) }` );            
        }
    }

    // Getter for graphql query to control when the wire is triggered
    get serviceAppointmentQuery(){
        if ( !this._saId ) return undefined;
        return gql`
            query serviceAppointment( $recordId: ID = "" ) {
                uiapi {
                    query {
                        ServiceAppointment (
                            where: { Id: { eq: $recordId } }
                        ) {
                            edges {
                                node {
                                    Id
                                    ParentRecordId { value }
                                }
                            }
                        }
                    }
                }
            }
        `;
    }    

    // Variable for the graphQL query
    get serviceAppointmentQueryVars(){
        return {
            recordId: this._saId
        };
    }     

    // Wire for ContentDocuments related to recordId
    @wire(graphql, { query: '$contentDocumentLinkQuery', variables: '$contentDocumentLinkQueryVars' } )
    contentDocumentLinkQueryResults( result ) {
        console.log( `contentDocumentLinkQueryResults callback for record Id: ${ this.recordId }` );
        const { data, error } = result;
        if ( data ) {
            console.log( `contentDocumentLinkQueryResults data retrieved: ${ JSON.stringify( data ) }` );
            let contDocLinks = data.uiapi.query.ContentDocumentLink.edges.map( ( edge ) => edge.node );
            let contDocIds = [];
            contDocLinks.forEach( ( contDocLink ) => {
                if ( contDocLink?.ContentDocumentId ){
                    contDocIds.push( contDocLink.ContentDocumentId.value );
                } 
            } );
            this._contDocIds = contDocIds;
        }
        if ( error ) {
            console.log( `contentDocumentLinkQueryResults Error: ${ JSON.stringify( error ) }` );            
        }
    }

    // Getter for graphql query to control when the wire is triggered
    get contentDocumentLinkQuery(){
        if ( !this.recordId ) return undefined;
        return gql`
            query contentDocumentLink( $linkedEntityId: ID = "" ) {
                uiapi {
                    query {
                        ContentDocumentLink(
                            where: { LinkedEntityId: { eq: $linkedEntityId } }
                            first: 2000
                        ) {
                            edges {
                                node {
                                    Id
                                    ContentDocumentId { value }
                                }
                            }
                        }
                    }
                }
            }
        `;
    }    

    // Variable for the graphQL query
    get contentDocumentLinkQueryVars(){
        return {
            linkedEntityId: this._recordId
        };
    } 

    // Wire for ContentVersions related to the ContentDocuments
    @wire(graphql, { query: '$contentVersionQuery', variables: '$contentVersionQueryVars' } )
    contentVersionQueryResults( result ) {
        console.log( `contentVersionQueryResults callback for record Ids: ${ JSON.stringify( this._contDocIds ) }` );
        const { data, error } = result;
        if ( data ) {
            console.log( `contentVersionQueryResults data retrieved: ${ JSON.stringify( data ) }` );
            const contVers = data.uiapi.query.ContentVersion.edges.map( ( edge ) => edge.node );
            const imgs = [];
            contVers.forEach( ( contVer ) => {
                imgs.push(
                    { 
                        Id: contVer.id, 
                        Title: contVer.Title.value,
                        Desc: contVer.Description.value,
                        FileType: contVer.FileType.value,
                        VersionDataUrl: contVer.VersionDataUrl.value 
                    } 
                );                
            } );
            this.images = imgs;
        }
        if ( error ) {
            console.log( `contentVersionQueryResults Error: ${ JSON.stringify( error ) }` );            
        }
    }

    // Getter for graphql query to control when the wire is triggered
    get contentVersionQuery(){
        if ( !this._contDocIds ) return undefined;
        return gql`
            query contentVersion( $recordIds: [ID] = [""], $fileTypes: [String] = [""] ) {
                uiapi {
                    query {
                        ContentVersion (
                            where: { 
                                ContentDocumentId: { in: $recordIds }, 
                                FileType: { in: $fileTypes } 
                            }
                            first: 2000,
                            orderBy: { CreatedDate: { order: DESC } }
                        ) {
                            edges {
                                node {
                                    Id
                                    Title { value }
                                    Description { value }
                                    FileType { value }
                                    VersionDataUrl { value }
                                }
                            }
                        }
                    }
                }
            }
        `;
    }    

    // Variable for the graphQL query
    get contentVersionQueryVars(){
        return {
            recordIds: this._contDocIds,
            fileTypes: ["JPG","JPEG","PNG","GIF"]
        };
    }  

    get gridCellBump(){
        return this._cellAlignment === 'bottom' ? 'top' : 'bottom';
    }

    // Grid class for image determined by nr of columns set
    get imgColClass(){
        return `slds-col slds-col_bump-${this.gridCellBump} slds-size_1-of-${this.numOfColumns} slds-var-p-around_small`;
    }

}