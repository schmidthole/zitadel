import { Alert, AlertType } from "@/components/alert";
import { Button } from "@/components/button";
import { DynamicTheme } from "@/components/dynamic-theme";
import { Translated } from "@/components/translated";
import { getServiceConfig } from "@/lib/service-url";
import { getBrandingSettings, getDefaultOrg } from "@/lib/zitadel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("idp");
  return { title: t("loginError.title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;
  const { organization, requestId, postErrorRedirectUrl } = searchParams;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  let defaultOrganization;
  if (!organization) {
    const org: Organization | null = await getDefaultOrg({ serviceConfig });
    if (org) {
      defaultOrganization = org.id;
    }
  }

  const branding = await getBrandingSettings({ serviceConfig, organization: organization ?? defaultOrganization });

  const loginParams = new URLSearchParams();
  if (organization) {
    loginParams.set("organization", organization);
  }
  if (requestId) {
    loginParams.set("requestId", requestId);
  }
  const loginHref = `/loginname${loginParams.toString() ? `?${loginParams}` : ""}`;
  const backHref = postErrorRedirectUrl || loginHref;

  return (
    <DynamicTheme branding={branding}>
      <div className="flex flex-col space-y-4">
        <h1>
          <Translated i18nKey="loginError.title" namespace="idp" />
        </h1>
      </div>

      <div className="w-full space-y-6">
        <Alert type={AlertType.ALERT}>
          <Translated i18nKey="loginError.description" namespace="idp" />
        </Alert>

        <Link href={backHref}>
          <Button className="bg-primary-light-500 hover:bg-primary-light-400 dark:bg-primary-dark-500 dark:hover:bg-primary-dark-400 w-full rounded-md px-4 py-3 text-center transition-all">
            <Translated i18nKey="accountNotFound.backToLogin" namespace="idp" />
          </Button>
        </Link>
      </div>
    </DynamicTheme>
  );
}
