Salesforce DX Essentials
========================

[![Version](https://img.shields.io/npm/v/sfdx-essentials.svg)](https://npmjs.org/package/sfdx-essentials)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-essentials.svg)](https://npmjs.org/package/sfdx-essentials) 
[![License](https://img.shields.io/npm/l/sfdx-essentials.svg)](https://github.com/nvuillam/sfdx-essentials/blob/master/package.json) 
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

# PLUGIN

Sometimes ... Salesforce tools are delivered without the mandatory capabilities allowing the advanced developments of partners and clients to survive.

Sometimes ... Salesforce R&D team shows some understanding, but sometimes ... not at all, even when a new SFDC Platform version prevents to generate a managed package.

So after the third plugin I needed to create during a few weeks (not for fun, but to allow our managed package to survive!) , I decided to join them on a single plugin: **SFDX Essentials** , and to publish it as open source , by solidarity with fellow victims of savage platform upgrades :)

Contributions are welcome, please run **npm run lint:fix** before making a new PR

A revamping of the plugin sources to be more typescript oriented has been performed for version 1.0.0.
Please create an issue if you have any problem

Command list

| Command | Description |
| ------------- | ------------- |
| [essentials:filter-metadatas](#essentialsfilter-metadatas) | **Filter metadatas generated from a SFDX Project** in order to be able to deploy only part of them on an org |
| [essentials:filter-xml-content](#essentialsfilter-xml-content) | **Filter content of metadatas (XML)** in order to be able to deploy only part of them on an org |
| [essentials:change-dependency-version](#essentialschange-dependency-version) | **Replace other managed packages dependency version number** ( very useful when you build a managed package over another managed package, like Financial Services Cloud ) |
| [essentials:fix-lightning-attributes-names](#essentialsfix-lightning-attributes-names) | **Replace reserved lightning attribute names in lightning components and apex classes** ( if you named a lightning attribute like a custom apex class, since Summer 18 you simply can not generate a managed package again) |
| [essentials:uncomment](#essentialsuncomment) | **Uncomment lines in sfdx/md files** (useful to manage @Deprecated annotations with managed packages) |
| [essentials:check-sfdx-project-consistency](#essentialscheck-sfdx-project-consistency) | **Check consistency between a SFDX project files and package.xml files** |
| [essentials:generate-permission-sets](#essentialsgenerate-permission-sets) | **Generate permission sets** from packageXml file depending JSON configuration file |
| [essentials:migrate-object-model](#essentialsmigrate-object-model) | **Migrate sources from an object model to a new object model** |


Please contribute :)

# INSTALLATION

```
    sfdx plugins:install sfdx-essentials
```

- Windows users: [sfdx plugin generator](https://github.com/forcedotcom/sfdx-plugin-generate) is bugged on windows (hardcode call of linux rm instruction) , so you may use [Git Bash](https://gitforwindows.org/) to run this code ( at least while it installs the plugin dependencies )

# UPGRADE

Its seems that sfdx plugins:update and sfdx update does not always work, in that case , uninstall then reinstall the plugin
```
    sfdx plugins:uninstall sfdx-essentials
    sfdx plugins:install sfdx-essentials
```

# CONTRIBUTE

- Fork the repo and clone it on your computer
- run $ sfdx plugins:link
- Now your calls to sfdx essentials are performed on your local sources 
- Once your code is ready and documented, please make a pull request :)

# COMMANDS

## `essentials:filter-metadatas`

Allows to filter metadatas folder generated by sfdx force:source:convert , using your own package.xml file

This can help if you need to deploy only part of the result of sfdx force:source:convert into a org, by filtering the result (usually in mdapi_output_dir) to keep only the items referenced in your own package.xml file

WARNING: This version does not support all the metadata types yet, please contribute if you are in a hurry :)

```
USAGE
  $ sfdx essentials:filter-metadatas OPTIONS

OPTIONS
  -i, --inputfolder=inputfolder    Input folder (default: "." )
  -o, --outputfolder=outputfolder  Output folder (default: filteredMetadatas)
  -p, --packagexml=packagexml      package.xml file path

DESCRIPTION
  
     Package.xml types currently managed:

     - ApexClass
     - ApexComponent
     - ApexPage
     - ApexTrigger
     - ApprovalProcess
     - AuraDefinitionBundle
     - BusinessProcess
     - ContentAsset
     - CustomApplication
     - CustomField
     - CustomLabel
     - CustomMetadata
     - CustomObject
     - CustomObjectTranslation
     - CustomSite
     - CustomTab
     - Document
     - EmailTemplate
     - EscalationRules
     - FlexiPage
     - Flow
     - FieldSet
     - GlobalValueSet
     - GlobalValueSetTranslation
     - HomePageLayout
     - ListView
     - LightningComponentBundle
     - Layout
     - NamedCredential
     - Network
     - PermissionSet
     - Profile
     - Queue
     - QuickAction
     - RecordType
     - RemoteSiteSetting
     - Report
     - SiteDotCom
     - StandardValueSet
     - StandardValueSetTranslation
     - StaticResource
     - Translations
     - ValidationRule
     - WebLink
     - Workflow

```

_See [conversion tables](https://github.com/nvuillam/sfdx-essentials/blob/master/src/common/metadata-utils.ts)_

EXAMPLES

```
  $ sfdx essentials:filter-metadatas -p myPackage.xml

  $ sfdx essentials:filter-metadatas -i md_api_output_dir -p myPackage.xml -o md_api_filtered_output_dir

  $ sfdx force:source:convert -d tmp/deployDemoQuali/
  $ sfdx essentials:filter-metadatas -i tmp/deployDemoQuali/ -p myPackage.xml -o tmp/deployDemoQualiFiltered/
  $ sfdx force:mdapi:deploy -d tmp/deployDemoQualiFiltered/ -w 60 -u DemoQuali

```

_See code: [src/commands/essentials/filter-metadatas.ts](https://github.com/nvuillam/sfdx-essentials/blob/master/src/commands/essentials/filter-metadatas.ts)_

## `essentials:filter-xml-content`

When you perform deployments from one org to another, the features activated in the target org may not fit the content of the sfdx/metadata files extracted from the source org.

You may need to filter some elements in the XML files, for example in the Profiles

This script requires a filter-config.json file following this example

```
USAGE
  $ sfdx essentials:filter-xml-content OPTIONS

OPTIONS
  -i, --inputfolder=inputfolder    Input folder (default: "." )
  -o, --outputfolder=outputfolder  Output folder (default: Input Folder + _xml_content_filtered)
  -p, --configFile=configFile      JSON file containing configuration. Default: filter-config.json

EXAMPLE
  $ sfdx essentials:filter-xml-content -i "retrieveUnpackaged" 

```

_See JSON configuration example: [examples/filter-xml-content-config.json](https://github.com/nvuillam/sfdx-essentials/blob/master/examples/filter-xml-content-config.json)_

_See code: [src/commands/essentials/filter-xml-content.ts](https://github.com/nvuillam/sfdx-essentials/blob/master/src/commands/essentials/filter-xml-content.ts)_

## `essentials:change-dependency-version`

Allows to change an external package dependency version

```
USAGE
  $ sfdx essentials:change-dependency-version OPTIONS

OPTIONS
  -f, --folder=folder              SFDX project folder containing files
  -j, --majorversion=majorversion  Major version
  -m, --minorversion=minorversion  Minor version
  -n, --namespace=namespace        Namespace of the managed package

EXAMPLE
  $ sfdx essentials:change-dependency-version -n FinServ -j 214 -m 7
```

_See code: [src/commands/essentials/change-dependency-version.ts](https://github.com/nvuillam/sfdx-essentials/blob/master/src/commands/essentials/change-dependency-version.ts)_

## `essentials:fix-lightning-attributes-names`

If you named a lightning attribute like a custom apex class, since Summer 18 you simply can not generate a managed package again.

This command lists all custom apex classes and custom objects names , then replaces all their references in lightning components and also in apex classes with their camelCase version.

Ex : MyClass_x attribute would be renamed myClassX

```
USAGE
  $ sfdx essentials:fix-lightning-attributes-names OPTIONS

OPTIONS
  -f, --folder=folder              SFDX project folder containing files (usually 'force-app/main/default'). Default : '.'

EXAMPLE
  $ sfdx essentials:fix-lightning-attributes-names 
```

_See code: [src/commands/essentials/fix-lightning-attributes-names.ts](https://github.com/nvuillam/sfdx-essentials/blob/master/src/commands/essentials/fix-lightning-attributes-names.ts)_

## `essentials:uncomment`

Once you flagged a packaged method as **@Deprecated** , you can not deploy it in an org not used for generating a managed package

This commands allows to uncomment desired lines just before making a deployment

Before :

``` 
// @Deprecated SFDX_ESSENTIALS_UNCOMMENT
global static List<OrgDebugOption__c> setDebugOption() {
	return null;
}
```

After :

```
@Deprecated // Uncommented by sfdx essentials:uncomment (https://github.com/nvuillam/sfdx-essentials)
global static List<OrgDebugOption__c> setDebugOption() {
	return null;
}
```

```
USAGE
  $ sfdx essentials:uncomment OPTIONS

OPTIONS
  -f, --folder=folder              SFDX project folder containing files (usually 'force-app/main/default'). Default : '.'
  -k, --uncommentKey=someString              Uncomment key. Default : 'SFDX_ESSENTIALS_UNCOMMENT'


EXAMPLE
  $ sfdx essentials:uncomment --folder "./Projects/DevRootSource/tmp/deployPackagingDxcDevFiltered" --uncommentKey "SFDX_ESSENTIALS_UNCOMMENT_DxcDev_"
```

_See code: [src/commands/essentials/uncomment.ts](https://github.com/nvuillam/sfdx-essentials/blob/master/src/commands/essentials/uncomment.ts)_

## `essentials:check-sfdx-project-consistency`

Allows to compare the content of a SFDX and the content of one or several package.xml files ( append, if several )

```
USAGE
  $ sfdx essentials:check-sfdx-project-consistency OPTIONS

OPTIONS
  -p, --folder=folder              List of package.xml files path
  -i, --inputfolder=someString              SFDX Project folder . Default : '.'

EXAMPLE
  $  sfdx essentials:check-sfdx-project-consistency -p "./Config/packageXml/package_DevRoot_Managed.xml,./Config/packageXml/package_DevRoot_xDemo.xml" -i "./Projects/DevRootSource/force-app/main/default"
```

_See code: [src/commands/essentials/check-sfdx-project-consistency.ts](https://github.com/nvuillam/sfdx-essentials/blob/master/src/commands/essentials/check-sfdx-project-consistency.ts)_


## `essentials:generate-permission-sets`

Allows to generate permission sets in XML format used for SFDX project from package.xml file depending on JSON configuration file 

```
USAGE
  $ sfdx essentials:generate-permission-sets OPTIONS

OPTIONS
  -c, --configFile=configFile              JSON configuration file that will be used in order to generate permission sets
  -p, --packageXml=someString              package.xml file that will be used in order to generate permission sets

EXAMPLE
  $  sfdx essentials:generate-permission-sets -c "../generate-permission-sets-config.json" -p "Config/packageXml/package.xml"
```

_See JSON configuration example: [examples/generate-permission-sets-config.json](https://github.com/nvuillam/sfdx-essentials/blob/master/examples/generate-permission-sets-config.json)_

_See code: [src/commands/essentials/generate-permission-sets.ts](https://github.com/nvuillam/sfdx-essentials/blob/master/src/commands/essentials/generate-permission-sets.ts)_

## `essentials:migrate-object-model`

Use this command if you need to replace a SObject by another one in all your sfdx sources

```
USAGE
  $ sfdx essentials:migrate-object-model OPTIONS

OPTIONS
  -c, --configFile=configFile              JSON configuration file 
  -i, --inputFolder=someString              Input folder (default: "." )
  -f, --fetchExpressionList     Fetch expression list. Let default if you dont know. ex: /aura/**/*.js,./aura/**/*.cmp,./classes/*.cls,./objects/*/fields/*.xml,./objects/*/recordTypes/*.xml,./triggers/*.trigger,./permissionsets/*.xml,./profiles/*.xml,./staticresources/*.json'
  -r, --replaceExpressions       Replace expressions using fetchExpressionList. default: true
  -d, --deleteFiles     Delete files with deprecated references. default: true
  -k, --deleteFilesExpr     Delete files matching expression. default: true
  -s, --copySfdxProjectFolder   Copy sfdx project files after process. default: true
  -v, --verbose   Verbose

EXAMPLE
  $  sfdx essentials:migrate-object-model -c "./config/migrate-object-model-config.json"
```

_See JSON configuration example: [examples/migrate-object-model-config.json](https://github.com/nvuillam/sfdx-essentials/blob/master/examples/migrate-object-model-config.json)_

_See code: [src/commands/essentials/migrate-object-model.ts](https://github.com/nvuillam/sfdx-essentials/blob/master/src/commands/essentials/migrate-object-model.ts)_
