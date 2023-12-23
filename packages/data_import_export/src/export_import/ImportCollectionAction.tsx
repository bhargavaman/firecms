import React, { useCallback, useEffect } from "react";
import {
    Button,
    cn,
    CollectionActionsProps,
    defaultBorderMixin,
    Dialog,
    DialogActions,
    DialogContent,
    EntityCollectionTable,
    FieldConfigBadge,
    FileUploadIcon,
    getFieldConfig,
    getPropertiesWithPropertiesOrder,
    getPropertyInPath,
    IconButton,
    Properties,
    Property,
    resolveCollection,
    ResolvedProperties,
    Select,
    SelectItem,
    Tooltip,
    Typography,
    useFireCMSContext,
    User,
    useSelectionController,
    useSnackbarController
} from "@firecms/core";
import { buildEntityPropertiesFromData } from "@firecms/schema_inference";
import { useImportConfig } from "../hooks";
import { convertDataToEntity, getInferenceType, getPropertiesMapping } from "../utils";
import { DataNewPropertiesMapping, ImportFileUpload, ImportSaveInProgress } from "../components";
import { ImportConfig } from "../types";

type ImportState = "initial" | "mapping" | "preview" | "import_data_saving";

export function ImportCollectionAction<M extends Record<string, any>, UserType extends User>({
                                                                                                 collection,
                                                                                                 path,
                                                                                                 collectionEntitiesCount,
                                                                                             }: CollectionActionsProps<M, UserType>
) {
    const context = useFireCMSContext();

    const snackbarController = useSnackbarController();

    const [open, setOpen] = React.useState(false);

    const [step, setStep] = React.useState<ImportState>("initial");

    const importConfig = useImportConfig();

    const handleClickOpen = useCallback(() => {
        setOpen(true);
        setStep("initial");
    }, [setOpen]);

    const handleClose = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    const onMappingComplete = useCallback(() => {
        setStep("preview");
    }, []);

    const onPreviewComplete = useCallback(() => {
        setStep("import_data_saving");
    }, []);

    const onDataAdded = async (data: object[]) => {
        importConfig.setImportData(data);

        if (data.length > 0) {
            const originProperties = await buildEntityPropertiesFromData(data, getInferenceType);
            importConfig.setOriginProperties(originProperties);

            const headersMapping = buildHeadersMappingFromData(data);
            importConfig.setHeadersMapping(headersMapping);
            const firstKey = Object.keys(headersMapping)?.[0];
            if (firstKey?.includes("id") || firstKey?.includes("key")) {
                const idColumn = firstKey;
                importConfig.setIdColumn(idColumn);
            }
        }
        setTimeout(() => {
            setStep("mapping");
        }, 100);
        // setStep("mapping");
    };

    const resolvedCollection = resolveCollection({
        collection,
        path,
        fields: context.propertyConfigs
    });

    const properties = getPropertiesWithPropertiesOrder<M>(resolvedCollection.properties, resolvedCollection.propertiesOrder as Extract<keyof M, string>[]) as ResolvedProperties<M>;

    const propertiesAndLevel = Object.entries(properties)
        .flatMap(([key, property]) => getPropertiesAndLevel(key, property, 0));
    const propertiesOrder = (resolvedCollection.propertiesOrder ?? Object.keys(resolvedCollection.properties)) as Extract<keyof M, string>[];
    if (collection.collectionGroup) {
        return null;
    }
    return <>

        <Tooltip title={"Import"}>
            <IconButton color={"primary"} onClick={handleClickOpen}>
                <FileUploadIcon/>
            </IconButton>
        </Tooltip>

        <Dialog open={open}
                fullWidth={step === "preview"}
                fullHeight={step === "preview"}
                maxWidth={step === "initial" ? "lg" : "7xl"}>
            <DialogContent className={"flex flex-col gap-4 my-4"} fullHeight={step === "preview"}>

                {step === "initial" && <>
                    <Typography variant={"h6"}>Import data</Typography>
                    <Typography variant={"body2"}>Upload a CSV, Excel or JSON file and map it to your existing
                        schema</Typography>
                    <ImportFileUpload onDataAdded={onDataAdded}/>
                </>}

                {step === "mapping" && <>
                    <Typography variant={"h6"}>Map fields</Typography>
                    <DataNewPropertiesMapping headersMapping={importConfig.headersMapping}
                                              idColumn={importConfig.idColumn}
                                              originProperties={importConfig.originProperties}
                                              destinationProperties={properties}
                                              onIdPropertyChanged={(value) => importConfig.setIdColumn(value)}
                                              buildPropertyView={({
                                                                      isIdColumn,
                                                                      property,
                                                                      propertyKey,
                                                                      importKey
                                                                  }) => {
                                                  return <PropertyTreeSelect
                                                      selectedPropertyKey={propertyKey ?? ""}
                                                      properties={properties}
                                                      propertiesAndLevel={propertiesAndLevel}
                                                      isIdColumn={isIdColumn}
                                                      onIdSelected={() => {
                                                          importConfig.setIdColumn(importKey);
                                                      }}
                                                      onPropertySelected={(newPropertyKey) => {

                                                          const newHeadersMapping: Record<string, string | null> = Object.entries(importConfig.headersMapping)
                                                              .map(([currentImportKey, currentPropertyKey]) => {
                                                                  if (currentPropertyKey === newPropertyKey) {
                                                                      return { [currentImportKey]: null };
                                                                  }
                                                                  if (currentImportKey === importKey) {
                                                                      return { [currentImportKey]: newPropertyKey };
                                                                  }
                                                                  return { [currentImportKey]: currentPropertyKey };
                                                              })
                                                              .reduce((acc, curr) => ({ ...acc, ...curr }), {});
                                                          importConfig.setHeadersMapping(newHeadersMapping as Record<string, string>);

                                                          if (newPropertyKey === importConfig.idColumn) {
                                                              importConfig.setIdColumn(undefined);
                                                          }

                                                      }}
                                                  />;
                                              }}/>
                </>}

                {step === "preview" && <ImportDataPreview importConfig={importConfig}
                                                          properties={properties as Properties<M>}
                                                          propertiesOrder={propertiesOrder}/>}

                {step === "import_data_saving" && importConfig &&
                    <ImportSaveInProgress importConfig={importConfig}
                                          collection={collection}
                                          onImportSuccess={(importedCollection) => {
                                              handleClose();
                                              snackbarController.open({
                                                  type: "info",
                                                  message: "Data imported successfully"
                                              });
                                          }}
                    />}

            </DialogContent>
            <DialogActions>

                {step === "mapping" && <Button onClick={() => setStep("initial")}
                                               variant={"text"}>
                    Back
                </Button>}

                {step === "preview" && <Button onClick={() => setStep("mapping")}
                                               variant={"text"}>
                    Back
                </Button>}

                <Button onClick={handleClose}
                        variant={"text"}>
                    Cancel
                </Button>

                {step === "mapping" && <Button variant="filled"
                                               onClick={onMappingComplete}>
                    Next
                </Button>}

                {step === "preview" && <Button variant="filled"
                                               onClick={onPreviewComplete}>
                    Save data
                </Button>}

            </DialogActions>
        </Dialog>

    </>;
}

const internalIDValue = "__internal_id__";

function PropertyTreeSelect({
                                selectedPropertyKey,
                                properties,
                                onPropertySelected,
                                onIdSelected,
                                propertiesAndLevel,
                                isIdColumn
                            }: {
    selectedPropertyKey: string | null;
    properties: Record<string, Property>;
    onPropertySelected: (propertyKey: string | null) => void;
    onIdSelected: () => void;
    propertiesAndLevel: PropertyAndLevel[];
    isIdColumn?: boolean;
}) {

    const selectedProperty = selectedPropertyKey ? getPropertyInPath(properties, selectedPropertyKey) : null;

    const renderValue = useCallback((selectedPropertyKey: string) => {

        if (selectedPropertyKey === internalIDValue) {
            return <Typography variant={"body2"} className={"p-4"}>Use this column as ID</Typography>;
        }

        if (!selectedPropertyKey || !selectedProperty) {
            return <Typography variant={"body2"} className={"p-4"}>Do not import this property</Typography>;
        }

        return <PropertySelectEntry propertyKey={selectedPropertyKey}
                                    property={selectedProperty as Property}/>;
    }, [selectedProperty]);

    const onSelectValueChange = useCallback((value: string) => {
        if (value === internalIDValue) {
            onIdSelected();
            onPropertySelected(null);
        } else if (value === "") {
            onPropertySelected(null);
        } else {
            onPropertySelected(value);
        }
    }, []);

    return <Select value={isIdColumn ? internalIDValue : (selectedPropertyKey ?? undefined)}
                   onValueChange={onSelectValueChange}
                   renderValue={renderValue}>

        <SelectItem value={""}>
            <Typography variant={"body2"} className={"p-4"}>Do not import this property</Typography>
        </SelectItem>

        <SelectItem value={internalIDValue}>
            <Typography variant={"body2"} className={"p-4"}>Use this column as ID</Typography>
        </SelectItem>

        {propertiesAndLevel.map(({
                                     property,
                                     level,
                                     propertyKey
                                 }) => {
            return <SelectItem value={propertyKey}
                               key={propertyKey}
                               disabled={property.dataType === "map"}>
                <PropertySelectEntry propertyKey={propertyKey}
                                     property={property}
                                     level={level}/>
            </SelectItem>;
        })}

    </Select>;
}

type PropertyAndLevel = {
    property: Property,
    level: number,
    propertyKey: string
};

function getPropertiesAndLevel(key: string, property: Property, level: number): PropertyAndLevel[] {
    const properties: PropertyAndLevel[] = [];
    properties.push({
        property,
        level,
        propertyKey: key
    });
    if (property.dataType === "map" && property.properties) {
        Object.entries(property.properties).forEach(([childKey, value]) => {
            properties.push(...getPropertiesAndLevel(`${key}.${childKey}`, value as Property, level + 1));
        });
    }
    return properties;
}

export function PropertySelectEntry({
                                        propertyKey,
                                        property,
                                        level = 0
                                    }: {
    propertyKey: string;
    property: Property;
    level?: number;
}) {

    const { propertyConfigs } = useFireCMSContext();
    const widget = getFieldConfig(property, propertyConfigs);

    return <div
        className="flex flex-row w-full text-start items-center h-full">

        {new Array(level).fill(0).map((_, index) =>
            <div className={cn(defaultBorderMixin, "ml-8 border-l h-12")} key={index}/>)}

        <div className={"m-4"}>
            <Tooltip title={widget?.name}>
                <FieldConfigBadge propertyConfig={widget}/>
            </Tooltip>
        </div>

        <div className={"flex flex-col flex-grow p-2 pl-2"}>
            <Typography variant="body1"
                        component="span"
                        className="flex-grow pr-2">
                {property.name
                    ? property.name
                    : "\u00a0"
                }
            </Typography>

            <Typography className=" pr-2"
                        variant={"body2"}
                        component="span"
                        color="secondary">
                {propertyKey}
            </Typography>
        </div>

    </div>;

}

export function ImportDataPreview<M extends Record<string, any>>({
                                                                     importConfig,
                                                                     properties,
                                                                     propertiesOrder
                                                                 }: {
    importConfig: ImportConfig,
    properties: Properties<M>,
    propertiesOrder: Extract<keyof M, string>[]
}) {

    useEffect(() => {
        const propertiesMapping = getPropertiesMapping(importConfig.originProperties, properties);
        const mappedData = importConfig.importData.map(d => convertDataToEntity(d, importConfig.idColumn, importConfig.headersMapping, properties, propertiesMapping, "TEMP_PATH"));
        importConfig.setEntities(mappedData);
    }, []);

    const selectionController = useSelectionController();

    return <EntityCollectionTable
        title={<div>
            <Typography variant={"subtitle2"}>Imported data preview</Typography>
            <Typography variant={"caption"}>Entities with the same id will be overwritten</Typography>
        </div>}
        tableController={{
            data: importConfig.entities,
            dataLoading: false,
            noMoreToLoad: false
        }}
        endAdornment={<div className={"h-12"}/>}
        filterable={false}
        sortable={false}
        selectionController={selectionController}
        displayedColumnIds={propertiesOrder.map(p => ({
            key: p,
            disabled: false
        }))}
        properties={properties}/>

}

function buildHeadersMappingFromData(objArr: object[]) {
    const headersMapping: Record<string, string> = {};
    objArr.forEach((obj) => {
        Object.keys(obj).forEach((key) => {
            // @ts-ignore
            const child = obj[key];
            if (typeof child === "object" && !Array.isArray(child)) {
                Object.entries(buildHeadersMappingFromData([child])).forEach(([subKey, mapping]) => {
                    headersMapping[`${key}.${subKey}`] = `${key}.${mapping}`;
                });
            }
            headersMapping[key] = key;
        });
    });
    return headersMapping;
}