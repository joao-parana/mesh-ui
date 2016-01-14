module meshAdminUi {

    // the global meshConfig as defined in meshConfig.js
    declare var meshConfig: any;

    /**
     * A collection of static utility methods for use throughout the app.
     */
    export class MeshUtils {

        /**
         * Given an object `item` with a `rolePerms` property of type ['create', 'read', 'update' 'delete'], this function
         * will return an object with each permission as a key set to `true`.
         */
        public rolePermissionsArrayToKeys(item: any): any {
            var permissions = {},
                perms = ['create', 'read', 'update', 'delete'];

            if (!(item.hasOwnProperty('rolePerms') && item.rolePerms instanceof Array)) {
                throw new Error('meshUtils#rolePermissionsArrayToKeys: argument must have a "rolePerms" property of type Array.');
            }

            perms.forEach(function (perm) {
                if (item.hasOwnProperty(perm)) {
                    throw new Error('meshUtils#rolePermissionsArrayToKeys: item already has a key "' + perm + '".');
                } else {
                    permissions[perm] = item.rolePerms.indexOf(perm) > -1;
                }
            });
            return permissions;
        }

        /**
         * Transform the object found in the "tags" property of a node into an array of tag objects.
         */
        public nodeTagsObjectToArray(tagsObject: INodeTagsObject): ITag[] {

            if (typeof tagsObject === 'undefined') {
                return [];
            }

            const makeSimpleTag = (item, tagsObject, familyName) => {
                return {
                    uuid: item.uuid,
                    fields: { name: item.name },
                    tagFamily: {
                        name: familyName,
                        uuid: tagsObject[familyName].uuid
                    }
                };
            };

            return Object.keys(tagsObject).reduce((prev, curr) => {
                let familyTags = tagsObject[curr].items.map(item => makeSimpleTag(item, tagsObject, curr));
                return prev.concat(familyTags);
            }, []);
        }

        public stringToColor(input: string): string {
            const safeColors = ['#D1D5FF', '#FFFBD1', '#EAE3FF', '#E3FFF3', '#E3EEFF', '#FFE3EA'];
            let value = input.split('').reduce((prev, curr) => {
                return prev + curr.charCodeAt(0);
            }, 0);
            return safeColors[value % safeColors.length];
        }

        public getBinaryFileUrl(projectName: string, nodeUuid: string, languageCode: string, fieldName: string, imageOptions?: IImageOptions) {
            let queryParams = '';
            if (imageOptions !== undefined) {
                queryParams = Object.keys(imageOptions).reduce((queryString, key) => {
                    return queryString + `${key}=${imageOptions[key]}&`;
                }, '?');
            }
            return meshConfig.apiUrl + projectName + `/nodes/${nodeUuid}/languages/${languageCode}/fields/${fieldName + queryParams}`;
        }

        /**
         * Given a node, check for any binary fields if one if found, return the first
         * in an object with key (field name) and value (binary field properties).
         */
        public getFirstBinaryField(node: INode): { key: string; value: IBinaryField } {
            let binaryFieldKey;
            let binaryFieldValue;

            for(let key in node.fields) {
                let field = node.fields[key];
                if (field && field.type && field.type === 'binary') {
                    if (binaryFieldValue === undefined) {
                        binaryFieldKey = key;
                        binaryFieldValue = field;
                    }
                }
            }

            return {
                key: binaryFieldKey,
                value: binaryFieldValue
            };
        }

        /**
         * Reads the mime type of a binary field and returns true if it is an image.
         */
        public isImageField(field: IBinaryField): boolean {
            if (field.mimeType !== undefined) {
                return this.isImageMimeType(field.mimeType);
            }
            return false;
        }

        public isImageMimeType(mimeType: string): boolean {
            return (/^image\//.test(mimeType));
        }

        /**
         * Deep clone an object, from http://stackoverflow.com/a/122190/772859
         * Note that this will not handle object containing circular references.
         *
         * @param obj
         * @returns {*}
         */
        private clone(obj) {
            if (obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj)
                return obj;

            var temp = obj.constructor();

            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    obj.isActiveClone = null;
                    temp[key] = this.clone(obj[key]);
                    delete obj.isActiveClone;
                }
            }

            return temp;
        }

        /**
         * Helper for filtering nodes by the display name against a string query.
         */
        public nodeFilterFn(node: INode, query: string): boolean {
            if (!query) {
                return true;
            }
            return -1 < node.fields[node.displayField].toLowerCase().indexOf(query.toLowerCase());
        }


        /**
         * Flatten an n-dimensional array.
         */
        public flatten(mdArray: any[]): any[] {
            var flatArray = [];

            if (!(mdArray instanceof Array)) {
                throw new Error('meshUtils#flatten: argument must be of type Array, got ' + typeof mdArray);
            }

            mdArray.forEach(item => {
                if (item instanceof Array) {
                    flatArray = flatArray.concat(this.flatten(item));
                } else {
                    flatArray.push(item);
                }
            });

            return flatArray;
        }

        /**
         * Generate a GUID
         */
        public generateGuid(): string {
            const s4 = () => {
                return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            };

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        }

        /**
         * From http://davidwalsh.name/javascript-debounce-function
         */
        public debounce(func: Function, wait: number, immediate?: boolean): Function {
            var timeout;
            return function() {
                var context = this, args = arguments;
                var later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        }

        /**
         * Returns a function which can be used to generate predicate functions to be used with the
         * AngularJS "filter" filter: https://docs.angularjs.org/api/ng/filter/filter.
         *
         * By default, using the `item in collection | filter: query` expression will make Angular check
         * *all* properties of the `item` object. If we want to only filter by selected properties, we need to
         * write our own predicate function. The following function abstracts this step away and would be used like so:
         *
         * ```
         * // controller
         * public filterString: string; // data-bound to some UI input
         *
         * public myFilter = (value) => {
         *   return this.mu.matchProps(value, ['foo', 'bar'], this.filterString);
         * }
         * ```
         */
        public matchProps(obj: any, properties: string[], filterText: string): boolean {
            if (filterText === null || filterText === undefined) {
                return true;
            }
            for (let property of properties) {
                if (obj[property]) {
                    if (typeof obj[property] === 'string') {
                        let match = -1 < obj[property].toLowerCase().indexOf(filterText.toLowerCase());
                        if (match) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    }

    angular.module('meshAdminUi.common')
        .service('mu', MeshUtils);

}