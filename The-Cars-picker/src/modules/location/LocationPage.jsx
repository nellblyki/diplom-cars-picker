const MAP_SRC =
  'https://yandex.ru/map-widget/v1/?ll=39.712237%2C47.237394&pt=39.712237%2C47.237394%2Cpm2rdm&z=16';

export function LocationPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/40">
        <h1 className="text-xl font-semibold">Наш адрес</h1>
        <p className="mt-2 text-sm text-slate-400">
          Ростов-на-Дону, площадь Гагарина, 1, 344000
        </p>
        <p className="text-xs text-slate-500">
          Координаты: 47.237394, 39.712237
        </p>
        <p className="mt-4 text-sm text-slate-300">
          На карте ниже отмечена точка, где располагается головной офис Cars Picker.
          В реальном проекте сюда можно добавить контактную форму или расписание.
        </p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-800 shadow-2xl shadow-black/40">
        <iframe
          title="Карта площадка Cars Picker"
          src={MAP_SRC}
          width="100%"
          height="420"
          allowFullScreen
          className="border-0"
        />
      </div>
    </div>
  );
}


