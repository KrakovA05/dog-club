import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — Лапа Клуб",
  description: "Политика обработки персональных данных зоогостиницы Лапа Клуб (Калуга).",
};

const UPDATED = "01 июня 2026 г.";

export default function PrivacyPage() {
  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto max-w-3xl px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Политика конфиденциальности
        </h1>
        <p className="text-muted-foreground text-sm mb-10">
          Редакция от {UPDATED}
        </p>

        <div className="prose prose-neutral max-w-none space-y-8 text-sm leading-relaxed">

          {/* 1 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">1. Общие положения</h2>
            <p className="text-muted-foreground">
              Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок
              обработки и защиты персональных данных пользователей сайта{" "}
              <strong>lapaclub.ru</strong> (далее — «Сайт»), которые принадлежат
              зоогостинице «Лапа Клуб» (далее — «Оператор»), расположенной по адресу:
              г. Калуга, ул. Дарвина, д. 14.
            </p>
            <p className="text-muted-foreground mt-3">
              Политика разработана в соответствии с требованиями Федерального закона
              от 27.07.2006 № 152-ФЗ «О персональных данных» и иных нормативных
              правовых актов Российской Федерации в области защиты персональных данных.
            </p>
            <p className="text-muted-foreground mt-3">
              Используя Сайт, вы выражаете согласие с условиями настоящей Политики.
              Если вы не согласны, пожалуйста, прекратите использование Сайта.
            </p>
          </div>

          {/* 2 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">2. Какие данные мы собираем</h2>
            <p className="text-muted-foreground mb-3">
              В зависимости от того, как вы взаимодействуете с Сайтом, мы можем
              обрабатывать следующие категории данных:
            </p>
            <table className="w-full text-sm border rounded-xl overflow-hidden">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Категория</th>
                  <th className="text-left px-4 py-2.5 font-medium">Данные</th>
                  <th className="text-left px-4 py-2.5 font-medium">Когда</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ["Регистрация", "Email-адрес, имя, номер телефона", "При создании аккаунта"],
                  ["Бронирование", "Дата визита, тип и имя питомца, особые пожелания", "При оформлении заявки"],
                  ["Технические данные", "IP-адрес, тип браузера, cookies, страницы посещений", "Автоматически при посещении"],
                ].map(([cat, data, when]) => (
                  <tr key={cat} className="border-t">
                    <td className="px-4 py-2.5 font-medium text-foreground">{cat}</td>
                    <td className="px-4 py-2.5">{data}</td>
                    <td className="px-4 py-2.5">{when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-muted-foreground mt-3">
              Мы не обрабатываем специальные категории персональных данных (сведения
              о расовой, национальной принадлежности, политических взглядах, состоянии
              здоровья, биометрические данные и т. п.).
            </p>
          </div>

          {/* 3 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">3. Цели и основания обработки</h2>
            <div className="space-y-2 text-muted-foreground">
              {[
                ["Исполнение договора оказания услуг", "Ст. 6 ч. 1 п. 5 152-ФЗ — необходимость для исполнения договора", "Обработка заявок, подтверждение бронирования, связь по вопросам услуги"],
                ["Регистрация и авторизация", "Согласие субъекта (ст. 6 ч. 1 п. 1 152-ФЗ)", "Создание личного кабинета, хранение истории бронирований"],
                ["Улучшение качества сервиса", "Законный интерес оператора (ст. 6 ч. 1 п. 5 152-ФЗ)", "Анализ использования Сайта, устранение ошибок"],
                ["Направление уведомлений", "Согласие субъекта", "Информирование об изменении статуса заявки"],
              ].map(([goal, basis, desc]) => (
                <div key={goal} className="rounded-xl border p-4">
                  <div className="font-medium text-foreground mb-1">{goal}</div>
                  <div className="text-xs mb-1 text-primary">{basis}</div>
                  <div>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 4 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">4. Хранение и защита данных</h2>
            <p className="text-muted-foreground">
              Персональные данные хранятся в защищённой базе данных, предоставляемой
              сервисом <strong>Supabase Inc.</strong> (серверы расположены в ЕС/США).
              Передача данных за пределы Российской Федерации осуществляется при условии
              обеспечения надлежащей защиты прав субъектов персональных данных (ст. 12 152-ФЗ).
            </p>
            <p className="text-muted-foreground mt-3">
              Мы применяем следующие меры защиты: шифрование передачи данных (HTTPS/TLS),
              разграничение доступа (аутентификация, политики RLS), резервное копирование,
              ограничение круга лиц, имеющих доступ к данным.
            </p>
            <p className="text-muted-foreground mt-3">
              <strong>Сроки хранения:</strong> данные аккаунта — до удаления аккаунта
              пользователем; данные о бронированиях — 3 года с даты оказания услуги
              (в соответствии с требованиями бухгалтерского учёта); технические логи — 90 дней.
            </p>
          </div>

          {/* 5 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">5. Передача данных третьим лицам</h2>
            <p className="text-muted-foreground mb-3">
              Мы не продаём и не передаём ваши персональные данные третьим лицам
              в коммерческих целях. Данные могут быть переданы следующим категориям
              получателей исключительно для обеспечения работы Сайта:
            </p>
            <div className="space-y-2 text-muted-foreground">
              {[
                ["Supabase Inc.", "Хранение данных и аутентификация", "supabase.com/privacy"],
                ["Vercel Inc.", "Хостинг и доставка контента", "vercel.com/legal/privacy-policy"],
                ["Yandex LLC", "Встроенные карты на странице «Контакты»", "yandex.ru/legal/confidential"],
                ["Resend Inc.", "Отправка транзакционных email-уведомлений", "resend.com/legal/privacy-policy"],
              ].map(([name, purpose, link]) => (
                <div key={name} className="rounded-xl border p-4 flex justify-between gap-4 flex-wrap">
                  <div>
                    <div className="font-medium text-foreground">{name}</div>
                    <div>{purpose}</div>
                  </div>
                  <a href={`https://${link}`} target="_blank" rel="noopener noreferrer"
                    className="text-primary text-xs underline-offset-2 hover:underline self-center shrink-0">
                    Политика
                  </a>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-3">
              Оператор также обязан раскрыть персональные данные по требованию
              уполномоченных государственных органов РФ в случаях, предусмотренных
              действующим законодательством.
            </p>
          </div>

          {/* 6 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">6. Cookies</h2>
            <p className="text-muted-foreground">
              Сайт использует cookie-файлы — небольшие текстовые файлы, сохраняемые
              в браузере. Мы используем:
            </p>
            <ul className="mt-3 space-y-1.5 text-muted-foreground list-none">
              {[
                ["Необходимые", "Аутентификация и безопасность сессии. Без них Сайт не работает корректно."],
                ["Функциональные", "Сохранение настроек и предпочтений пользователя."],
              ].map(([name, desc]) => (
                <li key={name} className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong className="text-foreground">{name}:</strong> {desc}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-3">
              Вы можете отключить cookie в настройках браузера, однако некоторые
              функции Сайта (в частности, авторизация) могут перестать работать.
            </p>
          </div>

          {/* 7 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">7. Ваши права</h2>
            <p className="text-muted-foreground mb-3">
              В соответствии со ст. 14–17 Федерального закона № 152-ФЗ вы имеете право:
            </p>
            <ul className="space-y-1.5 text-muted-foreground list-none">
              {[
                "Получить информацию о том, какие ваши данные мы обрабатываем (право на доступ);",
                "Потребовать исправления неточных или неполных данных (право на уточнение);",
                "Отозвать согласие на обработку данных — без ущерба для законности обработки, осуществлённой до отзыва;",
                "Потребовать удаления данных (право на забвение) — в случаях, предусмотренных законом;",
                "Обжаловать действия Оператора в Роскомнадзор (rkn.gov.ru) или в суд.",
              ].map((right, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{right}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-3">
              Для удаления аккаунта и всех связанных данных перейдите в
              «Личный кабинет → Удалить аккаунт». Обработка запроса — в течение 30 дней.
            </p>
          </div>

          {/* 8 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">8. Контактные данные оператора</h2>
            <div className="rounded-xl border p-5 text-muted-foreground space-y-1.5">
              <p><strong className="text-foreground">Оператор:</strong> Зоогостиница «Лапа Клуб»</p>
              <p><strong className="text-foreground">Адрес:</strong> 248000, г. Калуга, ул. Дарвина, д. 14</p>
              <p>
                <strong className="text-foreground">Email:</strong>{" "}
                <a href="mailto:info@lapaclub.ru" className="text-primary hover:underline underline-offset-2">
                  info@lapaclub.ru
                </a>
              </p>
            </div>
            <p className="text-muted-foreground mt-3">
              По вопросам обработки персональных данных обращайтесь на указанный email.
              Мы ответим в течение 10 рабочих дней.
            </p>
          </div>

          {/* 9 */}
          <div>
            <h2 className="text-lg font-semibold mb-3">9. Изменения политики</h2>
            <p className="text-muted-foreground">
              Оператор вправе вносить изменения в настоящую Политику в одностороннем
              порядке без уведомления пользователей. Новая редакция вступает в силу
              с момента её публикации на Сайте. Актуальная дата редакции указана
              в заголовке документа. Рекомендуем периодически проверять эту страницу.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
