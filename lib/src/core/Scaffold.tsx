import React, { PropsWithChildren, useCallback } from "react";
import equal from "react-fast-compare"

import { IconButton, Link, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { Drawer as FireCMSDrawer, DrawerProps } from "./Drawer";
import { useNavigationContext } from "../hooks";
import { CircularProgressCenter, ErrorBoundary, FireCMSAppBar, FireCMSAppBarProps, FireCMSLogo } from "./components";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useRestoreScroll } from "./internal/useRestoreScroll";

export const DRAWER_WIDTH = 280;

/**
 * @category Core
 */
export interface ScaffoldProps<ExtraDrawerProps = {}> {

    /**
     * Name of the app, displayed as the main title and in the tab title
     */
    name: string;

    /**
     * Logo to be displayed in the drawer of the CMS
     */
    logo?: string;

    /**
     * A component that gets rendered on the upper side of the main toolbar
     */
    toolbarExtraWidget?: React.ReactNode;

    /**
     * In case you need to override the view that gets rendered as a drawer
     * @see FireCMSDrawer
     */
    Drawer?: React.ComponentType<DrawerProps<ExtraDrawerProps>>;

    /**
     * Additional props passed to the custom Drawer
     */
    drawerProps?: ExtraDrawerProps;

    /**
     * Open the drawer on hover
     */
    autoOpenDrawer?: boolean;

    /**
     * A component that gets rendered on the upper side of the main toolbar.
     * `toolbarExtraWidget` has no effect if this is set.
     */
    FireCMSAppBarComponent?: React.ComponentType<FireCMSAppBarProps>;

}

/**
 * This view acts as a scaffold for FireCMS.
 *
 * It is in charge of displaying the navigation drawer, top bar and main
 * collection views.
 * This component needs a parent {@link FireCMS}
 *
 * @param props
 * @constructor
 * @category Core
 */

export const Scaffold = React.memo<PropsWithChildren<ScaffoldProps>>(
    function Scaffold(props: PropsWithChildren<ScaffoldProps>) {

        const {
            children,
            name,
            logo,
            toolbarExtraWidget,
            Drawer,
            autoOpenDrawer,
            FireCMSAppBarComponent = FireCMSAppBar
        } = props;

        const theme = useTheme();
        const largeLayout = useMediaQuery(theme.breakpoints.up("md"));

        const navigation = useNavigationContext();
        const { containerRef } = useRestoreScroll();

        const [drawerOpen, setDrawerOpen] = React.useState(false);
        const [onHover, setOnHover] = React.useState(false);

        const setOnHoverTrue = useCallback(() => setOnHover(true), []);
        const setOnHoverFalse = useCallback(() => setOnHover(false), []);

        const UsedDrawer = Drawer || FireCMSDrawer;

        const handleDrawerClose = useCallback(() => {
            setDrawerOpen(false);
        }, []);

        const computedDrawerOpen: boolean = drawerOpen || Boolean(largeLayout && autoOpenDrawer && onHover);
        return (
            <div
                className="flex h-screen w-screen"
                style={{
                    paddingTop: "env(safe-area-inset-top)",
                    paddingLeft: "env(safe-area-inset-left)",
                    paddingRight: "env(safe-area-inset-right)",
                    paddingBottom: "env(safe-area-inset-bottom)",
                    height: "100dvh"
                    // "@supports (height: 100dvh)": {
                    //     height: "100dvh"
                    // }
                }}>

                <FireCMSAppBarComponent title={name}
                                        drawerOpen={computedDrawerOpen}
                                        toolbarExtraWidget={toolbarExtraWidget}/>

                <StyledDrawer
                    onMouseEnter={setOnHoverTrue}
                    onMouseMove={setOnHoverTrue}
                    onMouseLeave={setOnHoverFalse}
                    open={computedDrawerOpen}
                    logo={logo}
                    hovered={autoOpenDrawer ? onHover : false}
                    setDrawerOpen={setDrawerOpen}>
                    <nav>
                        {navigation.loading
                            ? <CircularProgressCenter/>
                            : <UsedDrawer
                                hovered={onHover}
                                drawerOpen={computedDrawerOpen}
                                closeDrawer={handleDrawerClose}/>}
                    </nav>
                </StyledDrawer>

                <main
                    className="flex flex-col flex-grow overflow-auto">
                    <DrawerHeader/>
                    <div
                        ref={containerRef}
                        className={`flex-grow overflow-auto lg:m-0 lg:mx-4 lg:mb-4 lg:rounded-lg lg:border lg:border-solid lg:border-gray-100 lg:dark:border-gray-800 m-0 mt-1`}>

                        <ErrorBoundary>
                            {children}
                        </ErrorBoundary>

                    </div>
                </main>
            </div>
        );
    },
    equal
)

const DrawerHeader = () => {
    return (
        <div className="flex flex-col min-h-[68px]"></div>
    );
};

function StyledDrawer(props: {
    children: React.ReactNode,
    open: boolean,
    logo?: string,
    hovered: boolean,
    setDrawerOpen: (open: boolean) => void,
    onMouseEnter: () => void,
    onMouseMove: () => void,
    onMouseLeave: () => void
}) {
    const theme = useTheme();
    const largeLayout = useMediaQuery(theme.breakpoints.up("md"));

    return (
        <div className="transition-all ease-in duration-75 relative"
             onMouseEnter={props.onMouseEnter}
             onMouseMove={props.onMouseMove}
             onMouseLeave={props.onMouseLeave}
             style={{
                 width: props.open ? DRAWER_WIDTH : "72px"
             }}>

            {!largeLayout && (
                <IconButton
                    color="inherit"
                    aria-label="Open drawer"
                    edge="start"
                    onClick={() => props.setDrawerOpen(true)}
                    size="large"
                    className="absolute top-2 left-6"
                >
                    <MenuIcon/>
                </IconButton>
            )}

            <div
                className={"fixed left-0 top-0 transition-all duration-200 ease-in-out"}
                style={{
                    width: props.open ? DRAWER_WIDTH : "72px"
                }}
            >
                <div
                    className={`absolute right-4 top-4 ${
                        props.open ? "opacity-100" : "opacity-0"
                    } transition-opacity duration-200 ease-in-out`}>
                    <IconButton
                        onClick={() => props.setDrawerOpen(false)}
                    >
                        {theme.direction === "rtl"
                            ? <ChevronRightIcon/>
                            : <ChevronLeftIcon/>}
                    </IconButton>
                </div>

                {!props.open
                    ? (
                        <Tooltip title="Open menu" placement="right">
                            <IconButton
                                color="inherit"
                                aria-label="Open drawer"
                                edge="start"
                                onClick={() => props.setDrawerOpen(true)}
                                size="large"
                                className="absolute top-2 left-6"
                            >
                                <MenuIcon/>
                            </IconButton>
                        </Tooltip>
                    )
                    : (
                        ""
                    )}

                <div>
                    <div
                        className={`${
                            props.open
                                ? "py-4 pt-8 px-8 pr-24 block transition-padding duration-200 ease-in-out"
                                : "p-4 mt-2 block transition-padding duration-200 ease-in-out"
                        }`}>
                        <Link>
                            <Tooltip title="Home" placement="right">
                                {props.logo
                                    ? <img src={props.logo} alt="Logo"
                                           className="max-w-full max-h-full"/>
                                    : <FireCMSLogo/>}

                            </Tooltip>
                        </Link>
                    </div>
                    {props.children}
                </div>
            </div>
        </div>
    );
}
