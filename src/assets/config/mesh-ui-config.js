/* MESH UI configuration file */

window.MeshUiConfig = {
    // https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
    /** The ISO-639-1 code of the default language */
    defaultLanguage: 'en',
    /** The ISO-639-1 codes of the available languages for the frontend app */
    uiLanguages: ['en', 'de'],
    /** The ISO-639-1 codes of the available languages for Mesh */
    contentLanguages: ['en', 'de', 'pt', 'es'],
    /** The ISO-639-1 code of the language to be used in case a requested ressource is not available in the requested langauge */
    fallbackLanguage: 'en',
    /** This is the credential username for a ressource requested without authentication */
    anonymousUsername: 'anonymous',
    /**
     * Within the node editor in UI the feature "Preview" of a node will open a new tab to a defined frontend app.
     * Here, a function can be provided returning the URL which will be called by that component.
     * Preview URLs are defined per project, identified via project name property.
     * 
     * @example:
     * ```javascript
     * previewUrls: {
     *  "demo": [
     *    {
     *        label: 'Gentics Mesh Angular Demo',
     *        urlResolver: function (node) { return 'http://test.myapp/category/' + node.uuid + '?preview=true'; }
     *    }
     * ]
     *
     * ```
     * */
    previewUrls: {
        "demo": [
            {
                /** display name to see within preview url selection in frontend */
                label: 'Gentics Mesh Angular Demo',
                /**
                 * Function to be called in frontend to get url
                 * @param nodeUuid unique Mesh node
                 */
                // adopt to angular demo
                urlResolver: function (node) {

                    // custom route mapping
                    var segmentParent;
                    switch (node.schema.name) {
                        case 'category':
                            segmentParent = 'category';
                            break;

                        case 'vehicle':
                            segmentParent = 'product';
                            break;
                    
                        default:
                            throw new Error('No existing app route preview mapping configured for node of schema: ' + node.schema.name);
                    }

                    // return app preview URL
                    return '/demo/' + segmentParent + '/' + node.uuid + '?preview=true';
                }
            }
        ]
    }
};
