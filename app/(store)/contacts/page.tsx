import type { Metadata } from "next";
import { BalloonPhotoPlaceholder } from "@/components/ui/balloon-photo-placeholder";
import { Container } from "@/components/ui/container";
import { PageHeading } from "@/components/ui/page-heading";
import { phoneHref } from "@/features/store-settings/links";
import { loadPublicStoreSettings } from "@/features/store-settings/server-repository";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Контакты магазина воздушных шаров «Воздушная Москва».",
};

export default async function ContactsPage() {
  const settings = await loadPublicStoreSettings();

  return (
    <Container className="py-10 sm:py-16">
      <PageHeading
        eyebrow="Мы на связи"
        title="Контакты"
        description="Тестовые контакты помогут проверить структуру страницы. Перед запуском они будут заменены на реальные."
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[1.75rem] border border-[#e5dbd6] bg-white p-6 sm:p-8">
          <dl className="grid gap-6">
            <div>
              <dt className="text-sm font-semibold text-[#82747c]">Телефон</dt>
              <dd className="mt-1 text-lg font-extrabold text-[#342831]">
                <a href={phoneHref(settings.phone)} className="hover:text-[#8d2444]">
                  {settings.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-[#82747c]">Почта</dt>
              <dd className="mt-1 text-lg font-extrabold text-[#342831]">
                <a href={`mailto:${settings.email}`} className="hover:text-[#8d2444]">
                  {settings.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-[#82747c]">
                Время работы
              </dt>
              <dd className="mt-1 text-lg font-extrabold text-[#342831]">
                Ежедневно, {settings.workingHours}
              </dd>
            </div>
          </dl>
        </div>
        <BalloonPhotoPlaceholder
          variant="gender"
          className="min-h-80 rounded-[1.75rem]"
          label="Локальная заглушка фотографии мастерской воздушных шаров"
        />
      </div>
    </Container>
  );
}
