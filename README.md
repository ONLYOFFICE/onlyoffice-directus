# ONLYOFFICE extension for Directus

This extension allows working with office files in [Directus](https://directus.io/) using ONLYOFFICE Docs.

## Installing ONLYOFFICE Docs

To be able to work with office files within Directus, you will need an instance of ONLYOFFICE Docs. You can install the self-hosted version of the editors or opt for ONLYOFFICE Docs Cloud which doesn't require downloading and installation.

**Self-hosted editors**

You can install free Community version of ONLYOFFICE Docs or scalable Enterprise Edition.

To install free Community version, use [Docker](https://github.com/onlyoffice/Docker-DocumentServer) (recommended) or follow [these instructions](https://helpcenter.onlyoffice.com/installation/docs-community-install-ubuntu.aspx) for Debian, Ubuntu, or derivatives.

To install Enterprise Edition, follow the instructions [here](https://helpcenter.onlyoffice.com/installation/docs-enterprise-index.aspx).

Community Edition vs Enterprise Edition comparison can be found [here](#onlyoffice-docs-editions).

**ONLYOFFICE Docs Cloud**

To get ONLYOFFICE Docs Cloud, get started [here](https://www.onlyoffice.com/docs-registration.aspx).

## Installation and configuration of the ONLYOFFICE extension

Add the extension from the in-built Directus Marketplace.

Once done, go to the ONLYOFFICE Settings page within Directus and enter the following credentials: 

* **Doc Server Public URL**: Enter the URL of the installed ONLYOFFICE Docs (self-hosted or cloud instance).
* **Doc Server Jwt Secret**: Use the automatically generated secret key or enter your own. It should be the same as in the ONLYOFFICE Docs [config file](https://api.onlyoffice.com/docs/docs-api/additional-api/signature/).
* **Doc Server Jwt Header**: Use the default JWT authorization header or enter your own.

## Using the ONLYOFFICE extension

### Preparatory steps

To add a field to any of the Directus entities, go to **Settings -> Data Model**. Select the Collection to which you want to add the ONLYOFFICE field. Next, click **Create Field**.

**Using the standard File type field**

In the Relational section, select File, fill in the required fields and click the Save button. The field will be added to the collection.

Next, change the display of this element - click on 3 dots, select Edit field. On the Interface tab, select ONLYOFFICE Editor and click the Save button.

**Using the ONLYOFFICE type field**

You can also use the ONLYOFFICE field type, which does not require changing the way the element is displayed. The result will be exactly the same as when using the standard File field (it's actually the same File field, but with the ONLYOFFICE component pre-selected for editing).

To do so, select the ONLYOFFICE Editor item in the Other section and save the changes at the step of adding a field.

### Adding editors to pages

After the preparatory steps, you can create an entity based on the created model.

Go to the **Content** section, open the section of the created model and click the **Create Item** button. 

Then, click the **Create file** button. Next, to create a new file you need to enter the file name and select the file format. To load an existing file, click on the last selector item. Click the Save button so that the file is saved on the page.

### Working with office files

The created file will be displayed in embedded format. If you need to open the file for editing, click the **Open in new tab** button. If you need to replace the file, click the **Replace file** button.

When you click the Open in new tab button, the editor will open in a new tab. The button is visible to everyone who can see the page. Access rights to the editor depend on the access rights to the page - to edit or view.

When you click the Replace file button, a window will appear to create a new file or upload an existing one. For a new file, you need to specify the name and format. To upload an existing file, click the **Or Upload file** field. Don't forget to click the Save button.

## ONLYOFFICE Docs editions

Self-hosted **ONLYOFFICE Docs** is packaged as Document Server:

* Community Edition (`onlyoffice-documentserver` package)
* Enterprise Edition (`onlyoffice-documentserver-ee` package)

The table below will help you make the right choice.

| Pricing and licensing | Community Edition | Enterprise Edition |
| ------------- | ------------- | ------------- |
| | [Get it now](https://www.onlyoffice.com/download-community.aspx#docs-community)  | [Start Free Trial](https://www.onlyoffice.com/download.aspx#docs-enterprise)  |
| Cost  | FREE  | [Go to the pricing page](https://www.onlyoffice.com/docs-enterprise-prices.aspx)  |
| Simultaneous connections | up to 20 maximum  | As in chosen pricing plan |
| Number of users | up to 20 recommended | As in chosen pricing plan |
| License | GNU AGPL v.3 | Proprietary |
| **Support** | **Community Edition** | **Enterprise Edition** |
| Documentation | [Help Center](https://helpcenter.onlyoffice.com/installation/docs-community-index.aspx) | [Help Center](https://helpcenter.onlyoffice.com/installation/docs-enterprise-index.aspx) |
| Standard support | [GitHub](https://github.com/ONLYOFFICE/DocumentServer/issues) or paid | One year support included |
| Premium support | [Contact us](mailto:sales@onlyoffice.com) | [Contact us](mailto:sales@onlyoffice.com) |
| **Services** | **Community Edition** | **Enterprise Edition** |
| Conversion Service                | + | + |
| Document Builder Service          | + | + |
| **Interface** | **Community Edition** | **Enterprise Edition** |
| Tabbed interface                       | + | + |
| Dark theme                             | + | + |
| 125%, 150%, 175%, 200% scaling         | + | + |
| White Label                            | - | - |
| Integrated test example (node.js)      | + | + |
| Mobile web editors                     | - | +* |
| **Plugins & Macros** | **Community Edition** | **Enterprise Edition** |
| Plugins                           | + | + |
| Macros                            | + | + |
| **Collaborative capabilities** | **Community Edition** | **Enterprise Edition** |
| Two co-editing modes              | + | + |
| Comments                          | + | + |
| Built-in chat                     | + | + |
| Review and tracking changes       | + | + |
| Display modes of tracking changes | + | + |
| Version history                   | + | + |
| **Document Editor features** | **Community Edition** | **Enterprise Edition** |
| Font and paragraph formatting   | + | + |
| Object insertion                | + | + |
| Adding Content control          | + | + | 
| Editing Content control         | + | + | 
| Layout tools                    | + | + |
| Table of contents               | + | + |
| Navigation panel                | + | + |
| Mail Merge                      | + | + |
| Comparing Documents             | + | + |
| **Spreadsheet Editor features** | **Community Edition** | **Enterprise Edition** |
| Font and paragraph formatting   | + | + |
| Object insertion                | + | + |
| Functions, formulas, equations  | + | + |
| Table templates                 | + | + |
| Pivot tables                    | + | + |
| Data validation           | + | + |
| Conditional formatting          | + | + |
| Sparklines                   | + | + |
| Sheet Views                     | + | + |
| **Presentation Editor features** | **Community Edition** | **Enterprise Edition** |
| Font and paragraph formatting   | + | + |
| Object insertion                | + | + |
| Transitions                     | + | + |
| Presenter mode                  | + | + |
| Notes                           | + | + |
| **Form creator features** | **Community Edition** | **Enterprise Edition** |
| Adding form fields           | + | + |
| Form preview                    | + | + |
| Saving as PDF                   | + | + |
| | [Get it now](https://www.onlyoffice.com/download-community.aspx#docs-community)  | [Start Free Trial](https://www.onlyoffice.com/download.aspx#docs-enterprise)  |

\* If supported by DMS.

## Project info

Official website: [www.onlyoffice.com](https://www.onlyoffice.com)

Code repository: [github.com/ONLYOFFICE/onlyoffice-directus](https://github.com/ONLYOFFICE/onlyoffice-directus)

## User feedback and support

In case of technical problems, the best way to get help is to submit your issues [here](https://github.com/ONLYOFFICE/onlyoffice-directus/issues). 
Alternatively, you can contact ONLYOFFICE team on [forum.onlyoffice.com](https://forum.onlyoffice.com/).