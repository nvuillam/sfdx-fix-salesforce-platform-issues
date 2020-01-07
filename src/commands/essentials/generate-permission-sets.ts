import { Command, flags } from '@oclif/command';
import { FILE } from 'dns';

export default class ExecuteFilter extends Command {
    public static description = '';
    public static examples = [];
    public static args = [];
    public static flags = {

        // Flag with a value (-n, --name=VALUE)
        configfile: flags.string({ char: 'c', description: 'config.json file' }),
        packagexml: flags.string({ char: 'p', description: 'package.xml file path' }),
        inputfolder: flags.string({ char: 'i', description: 'Input folder (default: "." )' }),
        outputfolder: flags.string({ char: 'o', description: 'Output folder (default: permissionsets)' })
    };

    // Input params properties
    public configFile: string;
    public packageXmlFile: string;
    public inputFolder: string;
    public outputFolder: string;
    public namePermissionSet: string;

    // Internal properties
    public fs = require('fs');
    public fse = require('fs-extra');
    public xml2js = require('xml2js');
    public util = require('util');
    public path = require('path');
    public builder = require('xmlbuilder');
    public metadataUtils = require('../../common/metadata-utils');
    public packageXmlMetadatasTypeLs = [];
    public sobjectCollectedInfo = {};
    public translatedLanguageList = [];
    public summaryResult = { metadataTypes: {}, objects: [], objectsTranslations: [] };
    public describeMetadataAll = this.metadataUtils.describeMetadataTypes();

    // Runtime methods
    public async run() {

        // tslint:disable-next-line:no-shadowed-variable
        const { args, flags } = this.parse(ExecuteFilter);

        // Get input arguments or default values
        this.configFile = flags.configfile;
        this.packageXmlFile = flags.packagexml;

        // Read config.json file
        const filterConfig: JSON = this.fse.readJsonSync(this.configFile);

        this.buildDescriptionHeader(filterConfig);

        // Read package.xml file
        const parser = new this.xml2js.Parser();

        const promises = [];

        for (let configName in filterConfig) {
            if (filterConfig.hasOwnProperty(configName)) {
                let filterConfigNameJSONArray = filterConfig[configName];
                let extended = filterConfigNameJSONArray.extended;
                let packageXMLTypeJSONArray = filterConfigNameJSONArray.packageXMLTypeList;
                let packageXMLTypesConfigArray = new Array();
                let packageXMLTypeJSON: any;

                for (packageXMLTypeJSON of packageXMLTypeJSONArray) {
                    packageXMLTypesConfigArray.push(packageXMLTypeJSON.typeName);
                }

                const filePromise = new Promise((resolve, reject) => {
                    this.fs.readFile(this.packageXmlFile, (err, data) => {

                        parser.parseString(data, (err2, result) => {

                            // Array of Types from package.xml
                            const packageXmlTypes = result.Package.types;

                            let permissionSetsXmlElements = '<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">\n';
                            let permissionSetsExtendedXmlElement = '';
                            let permissionSetsMultipleXmlElement = '';
                            let permissionSetsSingleXmlElement = '';

                            // Build permission sets for each types (multiple) using extended option
                            if (extended !== '') {
                                for (let configNameExtended in filterConfig) {
                                    if (configNameExtended === extended) {
                                        let filterConfigNameJSONArrayExtended = filterConfig[configNameExtended];
                                        let packageXMLTypeJSONArrayExtended = filterConfigNameJSONArrayExtended.packageXMLTypeList;
                                        let packageXMLTypesConfigArrayExtended = new Array();
                                        let packageXMLTypeJSONExtended: any;

                                        for (packageXMLTypeJSONExtended of packageXMLTypeJSONArrayExtended) {
                                            packageXMLTypesConfigArrayExtended.push(packageXMLTypeJSONExtended.typeName);
                                        }

                                        // Array of Types from package.xml
                                        const packageXmlTypesExtended = result.Package.types;

                                        for (let packageXmlTypeExtended of packageXmlTypesExtended) {
                                            const packageXmlTypesNameExtended = packageXmlTypeExtended.name[0];

                                            if (packageXMLTypesConfigArrayExtended.includes(packageXmlTypesNameExtended) && filterConfigNameJSONArrayExtended.packageXMLTypeList.length > 0) {

                                                let indexOfType = packageXMLTypesConfigArrayExtended.indexOf(packageXmlTypesNameExtended);
                                                let packageXMLTypeConfigJSONExtended = filterConfigNameJSONArrayExtended.packageXMLTypeList[indexOfType];
                                                let packageXmlMembersExtended = packageXmlTypeExtended.members;

                                                for (let packageXmlMemberExtended of packageXmlMembersExtended) {
                                                    let permissionSetsXMLElmementNameExtended = this.describeMetadataAll[packageXmlTypesNameExtended].permissionSetTypeName;

                                                    // Test classes are excluded and also type name that are not described in describeMetadata (metadata-utils/index.ts)
                                                    if (packageXmlMemberExtended.indexOf('_m') < 0 && packageXmlMemberExtended.indexOf('Test') < 0 && permissionSetsXMLElmementNameExtended !== undefined) {
                                                        permissionSetsExtendedXmlElement += this.buildMultiplePermissionSetXML({ packageXMLTypeConfigJSON: packageXMLTypeConfigJSONExtended, typeMember: packageXmlMemberExtended });
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            // Build permission sets for each types (multiple) from packageXMLTypeList (JSON configuration file)
                            for (let packageXmlType of packageXmlTypes) {

                                const packageXmlTypesName = packageXmlType.name[0];

                                if (packageXMLTypesConfigArray.includes(packageXmlTypesName) && filterConfigNameJSONArray.packageXMLTypeList.length > 0) {

                                    let indexOfType = packageXMLTypesConfigArray.indexOf(packageXmlTypesName);
                                    let packageXMLTypeConfigJSON = filterConfigNameJSONArray.packageXMLTypeList[indexOfType];
                                    let packageXmlMembers = packageXmlType.members;

                                    for (let packageXmlMember of packageXmlMembers) {
                                        let permissionSetsXMLElmementName = this.describeMetadataAll[packageXmlTypesName].permissionSetTypeName;

                                        // Test classes are excluded and also type name that are not described in describeMetadata (metadata-utils/index.ts)
                                        if (packageXmlMember.indexOf('_m') < 0 && packageXmlMember.indexOf('Test') < 0 && permissionSetsXMLElmementName !== undefined) {
                                            permissionSetsMultipleXmlElement += this.buildMultiplePermissionSetXML({ packageXMLTypeConfigJSON, typeMember: packageXmlMember });
                                        }
                                    }
                                }
                            }

                            // Build permission sets for each types (single)
                            permissionSetsSingleXmlElement = this.buildSinglePermissionSetXML(filterConfigNameJSONArray);

                            // Build permission sets (extended, multiple & single)
                            permissionSetsXmlElements += permissionSetsExtendedXmlElement;
                            permissionSetsXmlElements += permissionSetsMultipleXmlElement;
                            permissionSetsXmlElements += permissionSetsSingleXmlElement;
                            permissionSetsXmlElements += '</PermissionSet>';

                            // Write permission sets in XML format
                            let outputFilename = './' + configName + '.permissionset-meta.xml';
                            this.fs.writeFile(outputFilename, permissionSetsXmlElements, (err3) => {
                                if (!err3) {
                                    console.log('      - ' + outputFilename);
                                    resolve();
                                }
                            });
                        });
                    });
                });

                promises.push(filePromise);
            }
        }

        console.log(' Output files: ');

        // Wait all files to be processed
        await Promise.all(promises);
    }

    // Build header description
    public buildDescriptionHeader(filterConfig: JSON) {

        const configFilename = this.configFile.substring(this.configFile.lastIndexOf('/') + 1);

        let basicConfig = filterConfig['Basic'];

        console.log('\n');

        if (basicConfig === undefined) {
            console.log('+-------------------------------------------WARNING!---------------------------------------------+');
            console.log('|                                                                                                |');
            console.log('|                                                                                                |');
            console.log('|   There is no basic permission set defined in ' + configFilename + '. The basic  |');
            console.log('|   permission set can be an easy way to generate permission sets and to avoid copy/paste if     |');
            console.log('|   there are common permissions sets. The "extended" parameter is used in order to indicate     |');
            console.log('|   the permission sets name that will be extended. In case there is no value for "extended",    |');
            console.log('|   only description in packageXMLTypeList parameter will be taken into account.                 |');
            console.log('|                                                                                                |');
            console.log('|                                                                                                |');
        }

        console.log('+---------------------------------------CONFIGURATION FILE---------------------------------------+');
        console.log('|                                                                                                |');
        console.log('|  Directory:                                                                                    |');
        console.log('|   - "' + this.configFile + '"          |');
        console.log('|                                                                                                |');
        console.log('|________________________________________________________________________________________________|');
        console.log('|                                                                                                |');
        console.log('| Order    Label          Extended from     Description                                          |');
        console.log('|________________________________________________________________________________________________|');
        console.log('|                                                                                                |');

        let order = 0;
        const labelLengthMax = 15;
        const extendedLengthMax = 18;
        const descriptionLengthMax = 52;

        for (let configName in filterConfig) {
            if (filterConfig.hasOwnProperty(configName)) {
                let labelLength = configName.length;
                let configNameFormatted = configName;
                let extendedLength = filterConfig[configName].extended.length;
                let extendedLabelFormatted = filterConfig[configName].extended;
                let descriptionLength = filterConfig[configName].description.length;
                let descriptionLabelFormatted = filterConfig[configName].description;

                for (let i = labelLength; i < labelLengthMax; i++) {
                    configNameFormatted = configNameFormatted + ' ';
                }

                for (let i = extendedLength; i < extendedLengthMax; i++) {
                    extendedLabelFormatted = extendedLabelFormatted + ' ';
                }

                for (let i = descriptionLength; i < descriptionLengthMax; i++) {
                    descriptionLabelFormatted = descriptionLabelFormatted + ' ';
                }

                if (descriptionLabelFormatted.length > descriptionLengthMax) {
                    descriptionLabelFormatted = descriptionLabelFormatted.substring(0, 47) + '...  ';
                }

                console.log('|  ' + order + '       ' + configNameFormatted + extendedLabelFormatted + descriptionLabelFormatted + ' |');
                order++;
            }
        }

        console.log('|                                                                                                |');
        console.log('|                                                                                                |');
        console.log('|                                  <Press any key to continue>                                   |');
        console.log('|                                                                                                |');
        console.log('|------------------------------------------------------------------------------------------------|\n');
    }

    // Build permission set information by type for single element
    public buildSinglePermissionSetXML(filterConfigNameJSONArray: JSON) {

        let permissionSetsXmlElement = '';

        for (let filterConfigNameJSON in filterConfigNameJSONArray) {
            if (filterConfigNameJSON !== 'extended' && filterConfigNameJSON !== 'packageXMLTypeList') {
                permissionSetsXmlElement += '<' + filterConfigNameJSON + '>' + filterConfigNameJSONArray[filterConfigNameJSON] + '</' + filterConfigNameJSON + '>\n';
            }
        }

        return permissionSetsXmlElement;
    }

    // Build permission set information by type for multiple element
    public buildMultiplePermissionSetXML({ packageXMLTypeConfigJSON, typeMember }: { packageXMLTypeConfigJSON: any; typeMember: string; }) {

        let typeName = packageXMLTypeConfigJSON.typeName;
        let permissionSetElementJSONArray = packageXMLTypeConfigJSON.permissionSetsElementList;
        let permissionSetsXmlElement;
        let permissionSetsXMLElmementName;
        let permissionSetXMLMemberName;

        permissionSetsXMLElmementName = this.describeMetadataAll[typeName].permissionSetTypeName;
        permissionSetXMLMemberName = this.describeMetadataAll[typeName].permissionSetMemberName;

        permissionSetsXmlElement = this.builder.create(permissionSetsXMLElmementName);
        permissionSetsXmlElement.ele(permissionSetXMLMemberName, typeMember).end({ pretty: true });

        for (let permissionSetElementJSON of permissionSetElementJSONArray) {
            let elementName = permissionSetElementJSON.elementName;
            let elementValue = permissionSetElementJSON.value;

            if (elementValue != undefined) {
                permissionSetsXmlElement.ele(elementName, elementValue).end({ pretty: true });
            }
        }

        return permissionSetsXmlElement;
    }
}
