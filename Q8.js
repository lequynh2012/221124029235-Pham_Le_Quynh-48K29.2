const margin = { top: 20, right: 200, bottom: 50, left: 100 },
    width = 1500 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("data_ggsheet.csv").then(rawData => {
    const parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");

    rawData.forEach(d => {
        d["Thời gian tạo đơn"] = parseDate(d["Thời gian tạo đơn"]);
        d["Tháng"] = ("0" + (d["Thời gian tạo đơn"].getMonth() + 1)).slice(-2);
        d["Mã đơn hàng"] = d["Mã đơn hàng"].trim();
        d["Nhóm gộp"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
    });

    const groupByMonthGroup = d3.rollups(
        rawData,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Tháng"],
        d => d["Nhóm gộp"]
    );

    const totalDistinctOrdersByMonth = d3.rollups(
        rawData,
        v => new Set(v.map(d => d["Mã đơn hàng"])).size,
        d => d["Tháng"]
    );

    const totalOrdersByMonthObj = {};
    totalDistinctOrdersByMonth.forEach(([month, count]) => {
        totalOrdersByMonthObj[month] = count;
    });

    const data = [];

    groupByMonthGroup.forEach(([month, groups]) => {
        const totalInMonth = totalOrdersByMonthObj[month];

        groups.forEach(([groupName, groupCount]) => {
            const probability = Math.round((groupCount / totalInMonth) * 100);

            data.push({
                month: month,
                group: groupName,
                probability: probability
            });
        });
    });

    const x = d3.scalePoint()
        .domain([...new Set(data.map(d => d.month))])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const dataGroup = d3.groups(data, d => d.group);

    const line = d3.line()
        .x(d => x(d.month))
        .y(d => y(d.probability));

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d => `Tháng ${d}`));

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d => d + "%"));

    svg.selectAll(".line")
        .data(dataGroup)
        .join("path")
        .attr("fill", "none")
        .attr("stroke", d => color(d[0]))
        .attr("stroke-width", 2)
        .attr("d", d => line(d[1]));

    const legend = svg.selectAll(".legend")
        .data(dataGroup)
        .join("g")
        .attr("transform", (d, i) => `translate(${width + 20},${i * 20})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => color(d[0]));

    legend.append("text")
        .attr("x", 15)
        .attr("y", 10)
        .text(d => d[0]);

    const groupedData = d3.group(data, d => d.month);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid black")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("display", "none");

    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.month))
        .attr("cy", d => y(d.probability))
        .attr("r", 5)
        .attr("fill", d => color(d.group))
        .on("mouseover", (event, d) => {
            const monthData = groupedData.get(d.month) || [];

            let tooltipContent = `<strong>Tháng ${String(d.month).padStart(2, '0')}</strong><br/>`;
            monthData.forEach(entry => {
                tooltipContent += `
                    <div style="display: flex; align-items: center;">
                        <div style="width: 10px; height: 10px; background: ${color(entry.group)}; border-radius: 50%; margin-right: 5px;"></div>
                        <span>${entry.group} ${entry.probability}%</span>
                    </div>
                `;
            });

            tooltip.html(tooltipContent)
                .style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("display", "none");
        });

}).catch(error => {
    console.error("Lỗi load dữ liệu:", error);
});
