import { LightningElement, api, wire } from 'lwc';
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
    @api showLatestImageVersion;
    @api showImgTitle;
    @api showImgDesc;
    @api thumbSize = 'Large';
    @api numOfColumns;
    @api 
    get cellAlignment() {
        return this._cellAlignment;
    }
    set cellAlignment( value ) {
        this._cellAlignment = value.toLowerCase();
    }

    // Indicator to render images
    renderImgs = false;

    // Record Id
    _recordId;

    // SA Record Id
    _saId;

    // Images
    _images = [];

    // Cell alignment
    _cellAlignment = 'top';

    // Content Document Ids
    _contDocIds;

    // Thumbnail sizes
    _thumbSizes = [
        { name: "Small", syntax: "THUMB120BY90" },
        { name: "Medium", syntax: "THUMB240BY180" },
        { name: "Large", syntax: "THUMB720BY480" },
    ];

    // Log info to console?
    _debug = true;

    // Wire for Service Appointment
    @wire(graphql, { query: '$serviceAppointmentQuery', variables: '$serviceAppointmentQueryVars' } )
    serviceAppointmentQueryResults( result ) {
        this.log( `serviceAppointmentQueryResults callback for record Id: ${ this._saId }` );
        const { data, error } = result;
        if ( data ) {
            this.log( `serviceAppointmentQueryResults data retrieved: ${ JSON.stringify( data ) }` );
            let sas = data.uiapi.query.ServiceAppointment.edges.map( ( edge ) => edge.node );
            this._recordId = sas?.ParentRecordId?.value;
            this.log( `serviceAppointmentQueryResults found Parent Record: ${ this._recordId }` );
        }
        if ( error ) {
            this.log( `serviceAppointmentQueryResults Error: ${ JSON.stringify( error ) }` );            
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

    // Wire for ContentDocuments related to _recordId
    @wire(graphql, { query: '$contentDocumentLinkQuery', variables: '$contentDocumentLinkQueryVars' } )
    contentDocumentLinkQueryResults( result ) {
        this.log( `contentDocumentLinkQueryResults callback for record Id: ${ this._recordId }` );
        const { data, error } = result;
        if ( data ) {
            this.log( `contentDocumentLinkQueryResults data retrieved: ${ JSON.stringify( data ) }` );
            let contDocLinks = data.uiapi.query.ContentDocumentLink.edges.map( ( edge ) => edge.node );
            let contDocIds = [];
            contDocLinks.forEach( ( contDocLink ) => {
                if ( contDocLink?.ContentDocumentId ){
                    contDocIds.push( contDocLink.ContentDocumentId.value );
                } 
            } );
            this._contDocIds = contDocIds;
            this.log( `contentDocumentLinkQueryResults Content Document Ids retrieved: ${ JSON.stringify( this._contDocIds ) }` );
        }
        if ( error ) {
            this.log( `contentDocumentLinkQueryResults Error: ${ JSON.stringify( error ) }` );            
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
        this.log( `contentVersionQueryResults callback for record Ids: ${ JSON.stringify( this._contDocIds ) }` );
        const { data, error } = result;
        if ( data ) {
            this.log( `contentVersionQueryResults data retrieved: ${ JSON.stringify( data ) }` );
            const contVers = data.uiapi.query.ContentVersion.edges.map( ( edge ) => edge.node );
            const imgs = [];
            const contDocIds = [];
            contVers.forEach( ( contVer ) => {
                if ( !contDocIds.includes( contVer.ContentDocumentId.value ) ) {
                    imgs.push(
                        { 
                            Id: contVer.id, 
                            Title: contVer.Title.value,
                            Desc: contVer.Description.value,
                            FileType: contVer.FileType.value,
                            VersionDataUrl: contVer.VersionDataUrl.value + this.imgThumbSize,
                            colCss: this.imgColClass
                        } 
                    );   
                    if ( this.showLatestImageVersion ) contDocIds.push( contVer.ContentDocumentId.value ); 
                }            
            } );
            this._images = imgs;

            this.renderImgs = true;
        }
        if ( error ) {
            this.log( `contentVersionQueryResults Error: ${ JSON.stringify( error ) }` );            
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
    get contentVersionQueryVars(){
        return {
            recordIds: this._contDocIds,
            fileTypes: ["JPG","JPEG","PNG","GIF"]
        };
    }  

    // Get thumbnail size syntax
    get imgThumbSize() {
        if ( this.thumbSize === "Full Size" ) return "";
        const thumb = this._thumbSizes.find( ( thumb ) => thumb.name === this.thumbSize );
        return "?thumb=" + thumb.syntax;
    }

    // CSS class bumps cell so alignment is the invert of that
    get gridCellBump(){
        return this._cellAlignment === 'bottom' ? 'top' : 'bottom';
    }

    // Grid class for image determined by nr of columns set
    get imgColClass(){
        return `slds-col slds-size_1-of-${this.numOfColumns} slds-col_bump-${this.gridCellBump}`;
    }

    // Return images in consumable format for template
    get imgData() {
        let rows = [];
        if ( this._images ) {
            let curCol = 1;
            let curRow = 1;
            let imgs = [];
            for ( let i = 0; i < this._images.length; i++ ) {
                imgs.push( this._images[ i ] );
                if ( curCol < this.numOfColumns ) {
                    curCol++;
                }
                else {
                    rows.push( 
                        {
                            Id: curRow,
                            imgs: imgs
                        }
                    );
                    curCol = 1;
                    curRow++;
                    imgs = [];
                }
            }
        }
        this.log( `imgData rows: ${ JSON.stringify( rows ) }` );
        return rows;
    }

    // Log to console
    log( msg) {
        if ( this._debug ) console.log( msg );
    }

}