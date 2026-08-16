FROM mcr.microsoft.com/dotnet/sdk:10.0.400-alpine AS build
WORKDIR /source
COPY . .
RUN dotnet restore backend/BabAlHara.sln --locked-mode \
    && dotnet publish backend/src/BabAlHara.Api/BabAlHara.Api.csproj \
        --configuration Release \
        --no-restore \
        --output /app/publish \
        /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0.11-alpine AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "BabAlHara.Api.dll"]
