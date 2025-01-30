# LWC Components for Salesforce Field Service Document Builder

This repository contains example LWC components that can be used in the Salesforce Field Service Document Builder templates. Please review the [official Salesforce documentation](https://developer.salesforce.com/docs/atlas.en-us.field_service_dev.meta/field_service_dev/fsl_dev_mobile_document_builder.htm) before reviewing and using these components, and the [documentation on how to create and edit Document Builder Templates](https://help.salesforce.com/s/articleView?id=sf.fs_document_builder_about.htm&type=5) etc.

## Disclaimer

**Please do not log a support case with Salesforce support. If you encounter an issue or have a question, create a new issue in this repository!**

This repository contains code intended to help Salesforce Field Service customers and partners accelerate their implementations. Please note the following:
* This code is not an official Salesforce product.
* It is not officially supported by Salesforce.
* The code serves as an example of how to implement specific functionality or make use of certain features.

Before using this code in a production environment, it is crucial that you:
* Adopt the code to fit your specific needs.
* Test thoroughly to ensure it works as expected in your environment.
* Consider the code to be your own and take full responsibility for its use.

By using this code, you acknowledge that Salesforce is not liable for any issues that may arise from its use.

## Image Gallery

This component is an example simple image gallery which can be used to show images related to the Service Appointment's parent Work Order. The component filters out any files that are not images so only images are being displayed. 

You can set the following parameters after dragging the component onto a Document Builder template:
* Gallery Title - Title shown at the top of the image gallery. Leave empty to not show a title.
* Show Parent Record Images - If the template is based on the Service Appointment object, this will show the images related to the parent record.
* Show Latest Image Version - If a file has multiple versions (ContentVersion), only show the latest version.
* Show Image Title - Shows the title of the image positioned beneath the image.
* Show Image Description - Shows the description of the image positioned beneath the image.
* Image Thumbnail Size - Select the thumbnail size of the image or select Full Size for the full image.
* Number Of Columns (1-12) - Number of columns used in the image gallery.
* Grid Cell Alignment - Alignment of the individual cells of the grid.

Note: The rendering of the image gallery in a service document might not be perfect. For example, the title and description are shown beneath the image otherwise rendering was not correct when in landscape mode. It's important to test rendering of the image gallery with a number of variations to test the rendering result.

Example result from a Work Order with 4 photos attached:

<img width="460" alt="image" src="https://github.com/iampatrickbrinksma/SFS-Document-Builder-LWC-Components/assets/78381570/7352fef0-5a32-4022-85d6-6c1c8870b3a8">

