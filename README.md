# LWC Component for Salesforce Field Service Document Builder

This repository contains example LWC components that can be used in the Salesforce Field Service Document Builder templates. Please review the [official Salesforce documentation](https://developer.salesforce.com/docs/atlas.en-us.field_service_dev.meta/field_service_dev/fsl_dev_mobile_document_builder.htm) before reviewing and using these components, and the [documentation on how to create and edit Document Builder Templates](https://help.salesforce.com/s/articleView?id=sf.fs_document_builder_about.htm&type=5) etc.

## Disclaimer
IMPORTANT: This code is not intended to be deployed directly to a Salesforce production environment, but to be used as an example. This is not a Salesforce product and is not officially supported by Salesforce.

## Image Gallery

This component is an example simple image gallery which can be used to show images related to the Service Appointment's parent Work Order. The component filters out any files that are not images so only images are being displayed. 

You can set the following parameters after dragging the component onto a Document Builder template:
* Gallery Title - Title that will be displayed above the gallery
* Number Of Columns - a value between 1 and 12 to define the number of columns the galler will use to display the images

