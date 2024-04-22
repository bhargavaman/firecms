import {
    CircularProgressCenter,
    FireCMSAppBarProps,
    Scaffold,
    useModeController,
    useSnackbarController
} from "@firecms/core";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "@fontsource/jetbrains-mono";
import "typeface-rubik";
import {
    FireCMSAppConfig,
    FireCMSBackend,
    FireCMSClientProps,
    FireCMSClientWithController,
    ProjectConfig,
    useBuildProjectConfig,
    useBuildCloudUserManagement
} from "@firecms/cloud";
import { SaasCMSAppBar } from "../components/SaasAppBar";
import { getRemoteConfig } from "../remote/remote_config";
import { saveRecentProject } from "../utils/recent_projects_prefs";
import { WebappCreationView } from "../components/WebappCreationView";

export const SaasCMSAppClient = function SaasCMSAppClient({
                                                              fireCMSBackend,
                                                              onAnalyticsEvent
                                                          }: {
    fireCMSBackend: FireCMSBackend,
    onAnalyticsEvent: (event: string, projectId: string, params?: object) => void;
}) {

    const modeController = useModeController();

    const { projectId } = useParams();
    if (!projectId) {
        throw new Error("SaasCMSAppClient: projectId is undefined");
    }

    useEffect(() => {
        if (fireCMSBackend.backendUid)
            saveRecentProject(fireCMSBackend.backendUid, projectId)
    }, [fireCMSBackend.backendUid, projectId]);

    return <SaasCMSAppClientInner
        projectId={projectId}
        modeController={modeController}
        fireCMSBackend={fireCMSBackend}
        basePath={`/p/${projectId}`}
        FireCMSAppBarComponent={SaasCMSAppBar}
        onAnalyticsEvent={(event: string, data?: object) => onAnalyticsEvent(event, projectId, data)}/>;

};

export const SaasCMSAppClientInner = function SaasCMSAppClientInner({
                                                                        projectId,
                                                                        modeController,
                                                                        fireCMSBackend,
                                                                        onAnalyticsEvent
                                                                    }: FireCMSClientProps) {

    const snackbarController = useSnackbarController();
    const [customizationLoading, setCustomizationLoading] = useState<boolean>(false);
    const [appConfig, setAppConfig] = useState<FireCMSAppConfig | undefined>();

    const projectConfig = useBuildProjectConfig({
        projectId,
        backendFirebaseApp: fireCMSBackend.backendFirebaseApp,
    });

    const userManagement = useBuildCloudUserManagement({
        backendFirebaseApp: fireCMSBackend.backendFirebaseApp,
        projectId,
        projectsApi: fireCMSBackend.projectsApi,
        usersLimit: projectConfig.usersLimit,
        canEditRoles: projectConfig.canEditRoles,
        fireCMSBackend
    });

    useEffect(() => {
        setCustomizationLoading(true);
        setAppConfig(undefined);
        if (projectConfig.customizationRevision) {
            console.debug("Loading remote config", projectConfig.customizationRevision)
            fireCMSBackend.projectsApi.getRemoteConfigUrl(projectId, projectConfig.customizationRevision)
                .then(remoteConfigUrl => {
                    console.log("Loading remote config from", remoteConfigUrl);
                    getRemoteConfig(remoteConfigUrl)
                        .then((config) => {
                            console.log("Remote config loaded", projectId, config);
                            setAppConfig(config);
                        })
                        .catch((e) => {
                            console.error("Error loading remote config", e);
                            snackbarController.open({
                                message: "Error loading remote config. Check logs",
                                type: "error"
                            });
                        })
                        .finally(() => setCustomizationLoading(false));
                })
        } else {
            setCustomizationLoading(false);
        }
    }, [projectConfig.customizationRevision, projectId]);

    if (!userManagement.loading && projectConfig.clientFirebaseMissing) {
        return <WebappCreationView projectId={projectId}/>;
    }

    if (userManagement.loading || (!projectConfig.clientFirebaseConfig && !projectConfig.configError)) {
        return <FullLoadingView projectId={projectId}
                                projectConfig={projectConfig}
                                FireCMSAppBarComponent={SaasCMSAppBar}
                                text={"Project loading"}
        />;
    }

    return <FireCMSClientWithController
        key={"project_" + projectId}
        projectId={projectId}
        userManagement={userManagement}
        projectConfig={projectConfig}
        modeController={modeController}
        fireCMSBackend={fireCMSBackend}
        basePath={`/p/${projectId}`}
        appConfig={appConfig}
        customizationLoading={customizationLoading}
        FireCMSAppBarComponent={SaasCMSAppBar}
        onAnalyticsEvent={(event: string, data?: object) => onAnalyticsEvent?.(event, data)}/>;

};

function FullLoadingView(props: {
    projectId: string,
    projectConfig?: ProjectConfig,
    FireCMSAppBarComponent?: React.ComponentType<FireCMSAppBarProps>,
    text?: string
}) {
    return <Scaffold
        key={"project_scaffold_" + props.projectId}
        name={props.projectConfig?.projectName ?? ""}
        logo={props.projectConfig?.logo}
        FireCMSAppBar={props.FireCMSAppBarComponent}
        includeDrawer={false}>
        <CircularProgressCenter text={props.text}/>
    </Scaffold>;
}
