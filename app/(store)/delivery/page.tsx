import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHeading } from "@/components/ui/page-heading";
import { loadPublicDeliveryZones } from "@/features/delivery/server-repository";
import type {
  DeliveryZone,
  DeliveryZoneType,
} from "@/features/delivery/types";
import { deliveryZoneTypeLabels } from "@/features/delivery/zone-utils";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description: "Условия доставки воздушных шаров по Москве и Московской области.",
};

const visibleGroups: DeliveryZoneType[] = [
  "pickup",
  "moscow_district",
  "region_city",
  "individual",
];

function priceLabel(zone: DeliveryZone) {
  if (zone.pricingMode === "manual") return "Стоимость уточнит менеджер";
  if (zone.zoneType === "pickup" || zone.basePriceKopecks === 0) {
    return "Бесплатно";
  }
  return formatMoney({
    amountKopecks: zone.basePriceKopecks,
    currency: "RUB",
  });
}

export default async function DeliveryPage() {
  const delivery = await loadPublicDeliveryZones();

  return (
    <Container className="py-10 sm:py-16">
      <PageHeading
        eyebrow="Управляемые тарифы"
        title="Доставка и оплата"
        description="Выберите округ Москвы, город Московской области или самовывоз. Тариф пересчитывается по актуальным настройкам магазина."
      />

      {delivery.unavailable ? (
        <div
          role="alert"
          className="mt-8 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6 text-amber-950"
        >
          <h2 className="text-lg font-extrabold">
            Тарифы временно не загрузились
          </h2>
          <p className="mt-2 leading-7">
            Страница магазина продолжает работать. Обновите её позднее или
            уточните стоимость у менеджера.
          </p>
        </div>
      ) : null}

      {!delivery.unavailable && delivery.zones.length === 0 ? (
        <div className="mt-8 rounded-[1.75rem] border border-dashed border-[#d9c7cd] bg-white p-8 text-center">
          <h2 className="text-xl font-extrabold text-[#342831]">
            Активные зоны пока не настроены
          </h2>
          <p className="mt-3 text-[#74666f]">
            Напишите менеджеру — он рассчитает доставку вручную.
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-5">
        {visibleGroups.map((type) => {
          const zones = delivery.zones.filter(
            (zone) => zone.zoneType === type,
          );
          if (!zones.length) return null;

          return (
            <section
              key={type}
              className="rounded-[1.75rem] border border-[#e5dbd6] bg-white p-5 sm:p-7"
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-[#a42a4d]">
                    {zones.length}{" "}
                    {zones.length === 1 ? "вариант" : "вариантов"}
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-[#342831]">
                    {deliveryZoneTypeLabels[type]}
                  </h2>
                </div>
                {type === "region_city" ? (
                  <p className="max-w-md text-sm leading-6 text-[#74666f]">
                    Если нужного города нет, при оформлении автоматически
                    включится индивидуальный расчёт.
                  </p>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {zones.map((zone) => (
                  <article
                    key={zone.id}
                    className="rounded-2xl bg-[#f8f2ee] p-5 text-[#4d3e47]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-extrabold text-[#342831]">
                        {zone.name}
                      </h3>
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-[#8d2444]">
                        {priceLabel(zone)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#74666f]">
                      {zone.description}
                    </p>
                    <dl className="mt-4 grid gap-2 text-xs leading-5 text-[#67555f]">
                      <div className="flex justify-between gap-3">
                        <dt>Минимальный заказ</dt>
                        <dd className="font-bold">
                          {formatMoney({
                            amountKopecks: zone.minimumOrderKopecks,
                            currency: "RUB",
                          })}
                        </dd>
                      </div>
                      {zone.freeFromKopecks !== null ? (
                        <div className="flex justify-between gap-3">
                          <dt>Бесплатно от</dt>
                          <dd className="font-bold">
                            {formatMoney({
                              amountKopecks: zone.freeFromKopecks,
                              currency: "RUB",
                            })}
                          </dd>
                        </div>
                      ) : null}
                      <div className="flex justify-between gap-3">
                        <dt>Срочная доставка</dt>
                        <dd className="text-right font-bold">
                          {zone.urgentDeliveryAvailable
                            ? `+${formatMoney({
                                amountKopecks:
                                  zone.urgentSurchargeKopecks,
                                currency: "RUB",
                              })}`
                            : "Недоступна"}
                        </dd>
                      </div>
                    </dl>
                    {zone.requiresManagerConfirmation ? (
                      <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">
                        Адрес и стоимость подтверждает менеджер.
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-8 rounded-[1.75rem] bg-[#342631] p-6 text-white sm:p-8">
        <h2 className="text-xl font-extrabold">Без платных сервисов адресов</h2>
        <p className="mt-3 max-w-3xl leading-7 text-white/75">
          Сейчас зона выбирается из списка и подтверждается менеджером для
          сложных адресов. Позже сюда можно подключить Яндекс Карты или DaData
          без изменения заказов и тарифов.
        </p>
        <Link href="/checkout" className="button-light mt-6">
          Перейти к оформлению
        </Link>
      </div>
    </Container>
  );
}
